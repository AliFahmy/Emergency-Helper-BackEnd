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
        this.router.patch(`${this.path}`, authMiddleware, validationMiddleware(UpdateClientDTO), this.updateAccount);
    }
    private getAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await clientModel.findById(request.user._id, ' -password  -verificationToken -_id -createdAt -updatedAt -__v',(err:any,client:IClient)=>{
            if(err){
                next(new SomethingWentWrongException());
            }
            else{
                let returnedAccount = client.toObject();
                returnedAccount.picture = client.picture.toString('base64');
                response.status(200).send(new Response(undefined,{returnedAccount}).getData());        
            }
        });
    }
    private updateAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        let newData: UpdateClientDTO = request.body;
        if (newData.picture) {
            newData.picture = Buffer.from(newData.picture, 'base64');
        }
        let newUser = await clientModel.findByIdAndUpdate(request.user._id, { $set: newData });
        if (newUser) {
            response.status(200).send(new Response('Updated Successfuly!').getData());
        }
        else {
            next(new SomethingWentWrongException());
        }
    }
    private register = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const userData: ClientRegistrationDTO = request.body;
        if (await userModel.findOne({ email: userData.email })) {
            next(new UserWithThatEmailAlreadyExistsException(userData.email));
        }
        else {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            try {
                const verificationToken = this.tokenManager.getToken({ email: userData.email });
                await clientModel.create({
                    ...userData,
                    password: hashedPassword,
                    verificationToken: verificationToken
                }, (err: any, user: IUser) => {
                    if (err) {
                        next(new SomethingWentWrongException());
                    }
                    else {
                        user.password = undefined;
                        this.mailer.sendRegistrationMail(user.name.firstName, user.verificationToken, user.email)
                            .then(result => {
                                response.status(201).send(new Response('Client Registered Successfully\nPlease Verify Your Email!').getData());
                            }).catch(result => {
                                response.status(201).send(new Response('Registered Successfully!').getData());
                            });
                    }
                });
            }
            catch{
                next(new SomethingWentWrongException());
            }
        }
    }
    private login = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const logInData: LogInDto = request.body;
        const user = await clientModel.findOne({ email: logInData.email });
        if (user) {
            const isPasswordMatching = await bcrypt.compare(logInData.password, user.password);
            if (isPasswordMatching) {
                user.password = undefined;
                if (user.isApproved) {
                    const token = this.tokenManager.getToken({ _id: user._id });
                    response.status(200).send(new Response('Login success', { token }).getData());
                }
                else {
                    this.mailer.sendRegistrationMail(user.name.firstName, user.verificationToken, user.email)
                        .then(result => {
                            next(new UserIsNotApprovedException(user.email));
                        }).catch(result => {
                            next(new SomethingWentWrongException());
                        });
                }
            }
            else {
                next(new WrongCredentialsException());
            }
        }
        else {
            next(new WrongCredentialsException());
        }
    }
}
export default ClientController;