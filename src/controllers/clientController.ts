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
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
/////////////////////////////////////////
import clientModel from '../models/user/Client';
import userModel from '../models/user/User';
/////////////////////////////////////////
import ClientRegistrationDTO from '../dto/clientDTO/clientRegistrationDTO';
import LogInDto from '../dto/loginDTO';
import UpdateClientDTO from '../dto/clientDTO/updateClientDTO';
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
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.get(`${this.path}`, authMiddleware, this.getAccount);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}`, authMiddleware,awsService.single('profilePicture'), validationMiddleware(UpdateClientDTO), this.updateAccount);
    }
    private getAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await clientModel
        .findById(request.user._id, ' -password -role -verificationToken -_id -createdAt -updatedAt -__v')
        .then((client:IClient)=>{
            response.status(200).send(new Response(undefined, { ...client.toObject() }).getData());
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err));
        })
    }
    private updateAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
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
                        await this.mailer.sendRegistrationMail(client.name.firstName, client.verificationToken, client.email,client.role)
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
                        await this.mailer.sendRegistrationMail(client.name.firstName, client.verificationToken, client.email,client.role)
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