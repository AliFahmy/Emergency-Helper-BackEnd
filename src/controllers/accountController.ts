import * as bcrypt from 'bcrypt';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
/////////////////////////////////////////
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
import ITokenData from '../interfaces/token/ITokenData';
import IUser from '../interfaces/user/IUser';
import IDataStoredInToken from '../interfaces/token/IDataStoredInToken';
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
import ICategory from '../interfaces/ICategory';
import IHelper from '../interfaces/user/IHelper';
/////////////////////////////////////////
import clientModel from '../models/Client';
import adminModel from './../models/Admin';
import userModel from './../models/User';
import helperModel from './../models/Helper';
import categoryModel from './../models/Category';
/////////////////////////////////////////
import CreateUserDTO from '../dto/createUserDTO';
import LogInDto from '../dto/loginDTO';
import HelperDTO from '../dto/helperDTO';
import UpdateAccountDTO from '../dto/updateAccountDTO';
import UpdatePasswordDTO from './../dto/UpdatePasswordDTO';
import UpdatePictureDTO from './../dto/updatePictureDTO';
/////////////////////////////////////////
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import WrongUserRoleException from './../exceptions/WrongUserRoleException';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import UpdateAccountException from './../exceptions/UpdateAccountException';
import CouldntSaveToDataBaseException from './../exceptions/CouldntSaveToDataBaseException';
import OldPasswordDosentMatchException from './../exceptions/OldPasswordDosentMatchException';


class AccountController implements IController {
    public path:string;
    public router:express.IRouter;
    
    constructor(){
        this.path = '/Account';
        this.router = express.Router();
        this.initializeRoutes();
    }
    private initializeRoutes(){

        this.router.post(`${this.path}/Login`,validationMiddleware(LogInDto),this.login);

        this.router.post(`${this.path}/RegisterUser`,validationMiddleware(CreateUserDTO),this.register);
        this.router.post(`${this.path}/Helper/Register`,validationMiddleware(HelperDTO),this.helperRegistration);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.get(`${this.path}`,authMiddleware,this.getAccount);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}`,authMiddleware,validationMiddleware(UpdateAccountDTO),this.updateAccount);
        this.router.patch(`${this.path}/Picture`,authMiddleware,validationMiddleware(UpdatePictureDTO),this.updatePicture);
        this.router.patch(`${this.path}/ChangePassword`,authMiddleware,validationMiddleware(UpdatePasswordDTO),this.updatePassword);
    }
    private helperRegistration =  async (request:express.Request,response:express.Response,next:express.NextFunction) =>{
        
        const userData:HelperDTO = request.body;
        
        
        if( await userModel.findOne({email:userData.email})){
             next(new UserWithThatEmailAlreadyExistsException(userData.email));
        }
        else{
            const hashedPassword = await bcrypt.hash(userData.password,10);
            let categoriesid = [];
            await categoryModel.find({'name':{ $in: userData.categories} },'-name -createdAt -updatedAt -__v',(err,categories)=>{
               if(err){
                    console.log("err category find")
                    next(err);
                }
                else{
                    for(let i=0;i<categories.length;i++){
                        categoriesid.push(categories[i]._id);
                    }
                }
            });
            // negrb ne3ml middleware yehwl kol al base64 le buffer 
            try{
                await helperModel.create({
                    ...userData,
                    picture:Buffer.from(userData.picture,'base64'),
                    frontID:Buffer.from(userData.frontID,'base64'),
                    backID:Buffer.from(userData.backID,'base64'),
                    certificate:Buffer.from(userData.certificate,'base64'),
                    categories:categoriesid,
                    password:hashedPassword
                },(err:any,helper:IHelper)=>{
                    if(err){
                        console.log(err);
                        next(err);
                    }
                    else{
                        helper.password = undefined;
                        const tokenData = this.createToken(helper);
                        response.status(201).send(tokenData);
                    }
                });
            }
            catch{
                next(new SomethingWentWrongException());
            }
        }
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
            let account:IUser = await userModel.findById(request.user._id,' -password -categories -_id -createdAt -updatedAt -__v');
            let returnedAccount = account.toObject();
            returnedAccount.picture = account.picture.toString('base64');
            response.status(200).send(returnedAccount);
    }
    private updatePicture = async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        const body : UpdatePictureDTO = request.body;
        const picture = Buffer.from(body.picture,'base64');
        await userModel.findByIdAndUpdate(request.user._id,{$set:{picture}},(err,user:IUser)=>{
            if(err){
                response.status(400).send(err);
            }
            else{
                response.status(201).send("Updated Successfully");
            }
        })
    }
    private updateAccount = async (request:IRequestWithUser,response:express.Response,next:express.NextFunction)=>{
        let newData:UpdateAccountDTO = request.body;
        console.log(newData)
        let newUser = await userModel.findByIdAndUpdate(request.user._id,{$set:newData});
        if(newUser){
                response.status(200).send("Updated Successfuly");
            }
        else{
                next(new UpdateAccountException(request.user.email));
            }
    }
    private updatePassword = async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        let newPassword:UpdatePasswordDTO = request.body;
        let User = await userModel.findById(request.user._id);
        const isPasswordMatching = await bcrypt.compare(newPassword.oldPassword,User.password);
        if(isPasswordMatching){
            User.password = await bcrypt.hash(newPassword.newPassword,10);
            await User.save((err)=>{
                if(err){
                    next(new CouldntSaveToDataBaseException())
                }else{
                    response.status(200).send("Updated Successfully");
                }
            })
        }else{
            next(new OldPasswordDosentMatchException())
        }
    }
    private register = async (request:express.Request,response:express.Response,next:express.NextFunction) => {
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
    private login = async (request:express.Request,response:express.Response,next:express.NextFunction) =>{
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