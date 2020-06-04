import * as bcrypt from 'bcrypt';
import * as express from 'express';
/////////////////////////////////////////
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
import IUser from '../interfaces/user/IUser';
import IClient from '../interfaces/user/IClient';
import IRequestWithClient from '../interfaces/httpRequest/IRequestWithClient';
/////////////////////////////////////////
import clientModel from '../models/user/Client';
/////////////////////////////////////////
import ClientRegistrationDTO from '../dto/clientDTO/clientRegistrationDTO';
import LogInDto from '../dto/loginDTO';
import UpdateClientDTO from '../dto/clientDTO/updateClientDTO';
import AddAddressDTO from './../dto/clientDTO/AddAddressDTO';
/////////////////////////////////////////
import WrongCredentialsException from '../exceptions/account/WrongCredentialsException';
import UserWithThatEmailAlreadyExistsException from '../exceptions/account/UserWithThatEmailAlreadyExistsException';
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import UserIsNotApprovedException from '../exceptions/account/UserIsNotApprovedException';
////////////////////////////////////////
import sendEmail from '../modules/sendEmail';
import TokenManager from '../modules/tokenManager';
import Response from '../modules/Response';
import { awsService } from './../middlewares/upload';
import IAddress from './../interfaces/user/IAddress';
import ILocation from './../interfaces/ILocation';

class ClientController implements IController {
    public path: string;
    public router: express.IRouter;
    private tokenManager: TokenManager;
    private mailer: sendEmail;
    constructor() {
        this.path = '/Client';
        this.router = express.Router();
        this.tokenManager = new TokenManager();
        this.mailer = new sendEmail();
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post(`${this.path}/Login`, validationMiddleware(LogInDto), this.login);
        this.router.post(`${this.path}/Register`, validationMiddleware(ClientRegistrationDTO), this.register);
        this.router.post(`${this.path}/Address`,authMiddleware, validationMiddleware(AddAddressDTO), this.addAddress);
        
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.get(`${this.path}`, authMiddleware, this.getAccount);
        this.router.get(`${this.path}/SavedAddresses`, authMiddleware, this.getSavedAddresses);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}`, authMiddleware,awsService.single('profilePicture'), validationMiddleware(UpdateClientDTO,true), this.updateAccount);
    }
    private getAccount = async (request: IRequestWithClient, response: express.Response, next: express.NextFunction) => {
        const {firstName,lastName,birthDate,email,gender,mobile,profilePicture} = request.user;
        response.status(200).send(new Response(undefined, {firstName,lastName,birthDate,email,gender,mobile,profilePicture}).getData());
    }
    private formateGeoAddresses = (addresses:IAddress[]) =>{
        let savedAddresses = []
            for(let i=0;i<addresses.length;i++){
                savedAddresses.push({
                    name:addresses[i].name,
                    addressName:addresses[i].addressName,
                    location:{
                        longitude:addresses[i].location.coordinates[0],
                        latitude:addresses[i].location.coordinates[1]
                    }
                })
            }
        return savedAddresses;
    }
    private getSavedAddresses = async (request: IRequestWithClient, response: express.Response, next: express.NextFunction) => {    
        response.status(200).send(new Response(undefined, {savedAddresses:this.formateGeoAddresses(request.user.savedAddresses)}).getData());
    }
    private addAddress = async (request: IRequestWithClient, response: express.Response, next: express.NextFunction) => {
        const address:AddAddressDTO = request.body;
        const addressGeoFormat = {
            ...address,
            location:{
                type:"Point",
                coordinates:[address.location.longitude,address.location.latitude]
            }
        }
        request.user.savedAddresses.push(addressGeoFormat);
        await request.user.save()
        .then((client:IClient)=>{
            if(client){
                response.status(201).send(new Response("Address Added Successfully", undefined).getData());
            }
            else{
                next(new SomethingWentWrongException())
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })

    }
    private updateAccount = async (request: IRequestWithClient, response: express.Response, next: express.NextFunction) => {
        let newData: UpdateClientDTO = request.body;
        let newObj = newData;
        request.file ? newObj['profilePicture'] = request.file['location'] : null;
        await clientModel
        .findByIdAndUpdate(request.user._id, { $set: newData })
        .then((client:IClient)=>{
            if(client){
                response.status(200).send(new Response('Updated Successfuly!').getData());
            }
            else{
                next(new SomethingWentWrongException());
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException())
        })
    }
    private register = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const userData: ClientRegistrationDTO = request.body;
        await clientModel
            .findOne({ email: userData.email })
            .then(async (value: IUser) => {
                if (value) {
                    next(new UserWithThatEmailAlreadyExistsException(userData.email));
                }
                else {
                    const hashedPassword = await bcrypt.hash(userData.password, 10);
                    const verificationToken = this.tokenManager.getToken({ email: userData.email });
                    await clientModel.create({
                        ...userData,
                        password: hashedPassword,
                        verificationToken: verificationToken
                    })
                    .then(async(client: IClient) => {
                        client.password = undefined;
                        await this.mailer.sendRegistrationMail(client.firstName, client.verificationToken, client.email,client.role)
                                .then(result => {
                                    response.status(201).send(new Response('Client Registered Successfully\nPlease Verify Your Email!').getData());
                                }).catch(result => {
                                    response.status(201).send(new Response('Registered Successfully!').getData());
                                });
                        })
                        .catch(err => {
                            next(new SomethingWentWrongException(err));
                        })
                }
            }).catch(err => {
                next(new SomethingWentWrongException(err));
            })
}
    private login = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const logInData: LogInDto = request.body;
    await clientModel
    .findOne({ email: logInData.email })
    .then(async(client:IClient)=>{
        if(client){
            await bcrypt.compare(logInData.password, client.password)
            .then(async (isPasswordMatching:boolean)=>{
                if(isPasswordMatching){
                    client.password = undefined;
                    if(client.isApproved){
                        const token = this.tokenManager.getToken({ _id: client._id });
                        response.status(200).send(new Response('Login success', { token }).getData());            
                    }
                    else{
                        await this.mailer.sendRegistrationMail(client.firstName, client.verificationToken, client.email,client.role)
                        .then(result => {
                            next(new UserIsNotApprovedException(client.email));
                        }).catch(result => {
                            next(new SomethingWentWrongException());
                        });
                    }
                }
                else{
                    next(new WrongCredentialsException())
                }
            })
            .catch(err=>{
                next(new SomethingWentWrongException())
            })
        }
        else{
            next(new WrongCredentialsException())
        }
    })
    .catch(err=>{
        next(new SomethingWentWrongException(err))
    })
    }

}
export default ClientController;