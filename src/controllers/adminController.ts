import * as express from 'express';
import * as bcrypt from 'bcrypt';
////////////////////////////////////////////////////
import IController from '../interfaces/IController';
import IClient from '../interfaces/user/IClient';
import IHelper from './../interfaces/user/IHelper';
import IUser from './../interfaces/user/IUser';
import IAdmin from './../interfaces/user/IAdmin';
import IRequestWithUser from 'interfaces/httpRequest/IRequestWithUser';
////////////////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import adminMiddleware from '../middlewares/adminMiddleware';
///////////////////////////////////////////////////
import adminModel from '../models/user/Admin';
import helperModel from '../models/user/Helper';
import clientModel from '../models/user/Client';
import userModel from '../models/user/User';
///////////////////////////////////////////////////
import LogInDto from '../dto/loginDTO';
//////////////////////////////////////////////////
import SomethingWentWrongException from '../exceptions/SomethingWentWrongException';
import WrongCredentialsException from '../exceptions/account/WrongCredentialsException';
////////////////////////////////////////
import sendEmail from '../modules/sendEmail';
import TokenManager from '../modules/tokenManager';
import Response from '../modules/Response';

class AdminController implements IController {
    public path: string;
    public router: express.IRouter;
    private tokenManager: TokenManager;
    private mailer: sendEmail;
    constructor() {
        this.path = '/Admin';
        this.router = express.Router();
        this.tokenManager = new TokenManager();
        this.mailer = new sendEmail();
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.get(`${this.path}/GetPendingHelpers`,adminMiddleware, this.getPendingHelpers)
        this.router.get(`${this.path}/GetAllHelpers`,adminMiddleware, this.getAllHelpers)
        this.router.get(`${this.path}/GetAllClients`, adminMiddleware, this.getAllClients)
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.post(`${this.path}/Login`, validationMiddleware(LogInDto), this.login);
        this.router.post(`${this.path}/ApproveHelper`,adminMiddleware, this.approveHelper);
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.delete(`${this.path}/DeleteUser/:id`, adminMiddleware, this.deleteUser)
    }
    private login = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const logInData: LogInDto = request.body;
        await adminModel.findOne({ email: logInData.email })
        .then(async(admin:IAdmin)=>{
            if(admin){
                await bcrypt.compare(logInData.password, admin.password)
                .then((result:boolean)=>{
                    if(result){
                        admin.password = undefined;
                        const token = this.tokenManager.getToken({ _id: admin._id });
                        response.status(200).send(new Response('Login Success', { token }).getData());
                    }
                    else{
                        next(new WrongCredentialsException());
                    }
                })
                .catch(err=>{
                    next(new SomethingWentWrongException())
                })
            }
            else{
               next(new WrongCredentialsException()); 
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException())
        })
    }
    private getPendingHelpers = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await helperModel.find({ isApproved: false }, '-password -createdAt -updatedAt -__v')
        .then((helpers:IHelper[])=>{
            if(helpers){
                response.status(200).send(new Response(undefined, { helpers }).getData());
            }
            else{
                next(new SomethingWentWrongException())
            }
        }).catch(err=>{
            next(new SomethingWentWrongException(err));
        })
            
    }
    private deleteUser = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const userID = request.params.id;
        await userModel.findOneAndRemove({ _id: userID })
        .then((user:IUser)=>{
            console.log(user);
            response.status(200).send(new Response('User Deleted Successfully').getData());
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
    }
    private getAllClients = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await clientModel.find({}, '-password -createdAt -updatedAt -__v')
        .then((clients:IClient[])=>{
            if(clients){
                response.status(200).send(new Response(undefined, { clients }).getData());
            }
            else{
                next(new SomethingWentWrongException())
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException());
        })
    }
    private getAllHelpers = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await helperModel.find({}, '-password -createdAt -updatedAt -__v')
        .then((helpers:IHelper[])=>{
            if(helpers){
                response.status(200).send(new Response(undefined, { helpers }).getData());
            }
            else{
                next(new SomethingWentWrongException())
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException())
        })
    }
    private approveHelper = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const helperID = request.body.id;
        await helperModel.findById(helperID)
        .then(async(helper:IHelper)=>{
            if(helper){
            helper.isApproved = true;
            await helper.save()
            .then((helper:IHelper)=>{
                response.status(200).send(new Response('Helper Approved').getData());
            })
            .catch(err=>{
                next(new SomethingWentWrongException(err));
            })    
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err));
        })
    }
}

export default AdminController;