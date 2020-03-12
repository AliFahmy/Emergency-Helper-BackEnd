import * as bcrypt from 'bcrypt';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
/////////////////////////////////////////
import Controller from '../interfaces/IController';
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import ITokenData from '../interfaces/token/ITokenData';
import IUser from '../interfaces/user/IUser';
import IPhoto from './../interfaces/IPhoto';
import IDataStoredInToken from '../interfaces/token/IDataStoredInToken';
import IRequestWithUser from 'interfaces/httpRequest/IRequestWithUser';
/////////////////////////////////////////
import clientModel from '../models/Client';
import adminModel from './../models/Admin';
import userModel from './../models/User';
/////////////////////////////////////////
import CreateUserDTO from '../dto/userDTO';
import  LogInDto from '../dto/loginDTO';
import HelperDTO from 'dto/helperDTO';
/////////////////////////////////////////
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import WrongUserRoleException from './../exceptions/WrongUserRoleException';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';


class AccountController implements Controller {
    public path:string;
    public router:express.IRouter;
    constructor(){
        this.path = '/account';
        this.router = express.Router();
        this.initializeRoutes(); 
    }
    private initializeRoutes(){
        this.router.post(`${this.path}/register`,validationMiddleware(CreateUserDTO),this.registration);
        this.router.post(`${this.path}/login`,validationMiddleware(LogInDto),this.loggingIn);
        this.router.get(`${this.path}`,authMiddleware,this.getAccount)
    }
    
    private createToken(user:IUser) : ITokenData{
        const secret = process.env.JWT_SECRET;
        const dataStoredInToken : IDataStoredInToken = {
            _id: user._id
        };
        return {
            token: jwt.sign(dataStoredInToken,secret)
        };
    }

    private getAccount =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        response.status(200).send(request.user);
    }
    private registration = async (request:express.Request,response:express.Response,next:express.NextFunction) => {
        const userData:CreateUserDTO = request.body;
        if( await userModel.findOne({email:userData.email})){
            next(new UserWithThatEmailAlreadyExistsException(userData.email));
        }
        else{
            const hashedPassword = await bcrypt.hash(userData.password,10);
            let model=undefined;
            if(userData.userRole === 0){
                model = clientModel; 
            }
            else if(userData.userRole === 1){
                model = adminModel;
            }
            else{
                next(new WrongUserRoleException());
                return;
            }
            try{
                const user = await model.create({
                    ...userData,
                    password:hashedPassword
                });
                user.password = undefined;
                const tokenData = this.createToken(user);
                response.status(201).send(tokenData);
            }
            catch{
                next(new SomethingWentWrongException());
            }

        }
    }

    private loggingIn = async (request:express.Request,response:express.Response,next:express.NextFunction) =>{
        const logInData:LogInDto = request.body;
        const user = await userModel.findOne({email:logInData.email});
        if(user){
            const isPasswordMatching = await bcrypt.compare(logInData.password,user.password);
            if(isPasswordMatching){
                user.password = undefined;
                const tokenData = this.createToken(user);
                response.status(200).send(tokenData);
            }
            else{
                next(new WrongCredentialsException());
            }
        }
        else{
            next(new WrongCredentialsException());
        }
    }
}
export default AccountController;