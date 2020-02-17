import * as bcrypt from 'bcrypt';
import * as express from 'express';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import Controller from '../interfaces/IController';
import validationMiddleware from '../middlewares/validation';
import CreateUserDTO from '../dto/userDTO';
import  LogInDto from '../dto/loginDTO';
import ITokenData from '../interfaces/token/ITokenData';
import IUser from '../interfaces/user/IUser';
import * as jwt from 'jsonwebtoken';
import IDataStoredInToken from '../interfaces/token/IDataStoredInToken';
import clientModel from './../models/Client';
class AccountController implements Controller {
    public path = '/account';
    public router = express.Router();
    private client= clientModel;
    constructor(){
        this.initializeRoutes();
    }
    private initializeRoutes(){
        this.router.post(`${this.path}/register`,validationMiddleware(CreateUserDTO),this.registration);
        this.router.post(`${this.path}/login`,validationMiddleware(LogInDto),this.loggingIn);
        this.router.post(`${this.path}/logout`,this.loggingOut);
    }
    private createToken(user:IUser) : ITokenData{
        const expiresIn = 60*60;//hour
        const secret = process.env.JWT_SECRET;
        const dataStoredInToken : IDataStoredInToken = {
            _id: user._id
        };
        return {
            expiresIn: expiresIn,
            token: jwt.sign(dataStoredInToken,secret,{expiresIn})
        };
    }
    private loggingOut = (request: express.Request, response: express.Response) => {
        response.setHeader('Set-Cookie', ['Authorization=;Max-age=0']);
        response.send(200);
    }
    private registration = async (request:express.Request,response:express.Response,next:express.NextFunction) => {
        const userData:CreateUserDTO = request.body;
        if( await this.client.findOne({email:userData.email})){
            next(new UserWithThatEmailAlreadyExistsException(userData.email));
        }
        else{
            const hashedPassword = await bcrypt.hash(userData.password,10);
            const user = await this.client.create({
                ...userData,
                name:{
                    firstName:userData.firstName,
                    lastName:userData.lastName
                },
                password:hashedPassword
            });
            user.password = undefined;
            const tokenData = this.createToken(user);
            response.send(tokenData);
        }
    }
    private loggingIn = async (request:express.Request,response:express.Response,next:express.NextFunction) =>{
        const logInData : LogInDto = request.body;
        const user = await this.client.findOne({email:logInData.email});
        if(user){
            const isPasswordMatching = await bcrypt.compare(logInData.password,user.password);
            if(isPasswordMatching){
                user.password = undefined;
                const tokenData = this.createToken(user);
                response.send(tokenData);
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