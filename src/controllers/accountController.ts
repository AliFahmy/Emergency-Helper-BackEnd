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
/////////////////////////////////////////
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import WrongUserRoleException from './../exceptions/WrongUserRoleException';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import OldPasswordDosentMatchException from './../exceptions/OldPasswordDosentMatchException';
import UserIsNotApprovedException from './../exceptions/UserIsNotApprovedException';
////////////////////////////////////////
import sendEmail from '../modules/sendEmail';


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
        this.router.get(`${this.path}/ValidateToken`,this.validateToken);
        this.router.get(`${this.path}`,authMiddleware,this.getAccount);
        this.router.get(`${this.path}/VerifyAccount/:verificationToken`,this.verifyAccount);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}`,authMiddleware,validationMiddleware(UpdateAccountDTO,true),this.updateAccount);
        //this.router.patch(`${this.path}/Picture`,authMiddleware,validationMiddleware(UpdatePictureDTO),this.updatePicture);
        this.router.patch(`${this.path}/ChangePassword`,authMiddleware,validationMiddleware(UpdatePasswordDTO),this.updatePassword);
    }
    private helperRegistration =  async (request:express.Request,response:express.Response,next:express.NextFunction) =>{
        const userData:HelperDTO = request.body;
        if( await userModel.findOne({email:userData.email}))
        {
             next(new UserWithThatEmailAlreadyExistsException(userData.email));
        }
        else{
            const hashedPassword = await bcrypt.hash(userData.password,10);
            let categoriesid = [];
            await categoryModel.find({'name':{ $in: userData.categories} },'-name -createdAt -updatedAt -__v',(err,categories:ICategory[])=>{
               if(err){
                    next(new SomethingWentWrongException());
                }
                else{
                    for(let i=0;i<categories.length;i++){
                        categoriesid.push(categories[i]._id);
                    }
                }
            });
            // negrb ne3ml middleware yehwl kol al base64 le buffer 
            try{
                const verificationToken = jwt.sign({email:userData.email},process.env.JWT_SECRET);
                await helperModel.create({
                    ...userData,
                    picture:Buffer.from(userData.picture,'base64'),
                    frontID:Buffer.from(userData.frontID,'base64'),
                    backID:Buffer.from(userData.backID,'base64'),
                    certificate:Buffer.from(userData.certificate,'base64'),
                    categories:categoriesid,
                    password:hashedPassword,
                    verificationToken:verificationToken
                },async (err:any,helper:IHelper)=>{
                    if(err){
                        next(new SomethingWentWrongException());
                    }
                    else{
                        if(this.sendRegistrationMail(helper.name.firstName,helper.verificationToken,helper.email)){
                            response.status(201).send("Registered Successfully Verify Your Email!");
                        }
                        else{
                            response.status(201).send("Registered Successfully!");    
                        }
                    }
                });
            }
            catch{
                next(new SomethingWentWrongException());
            }
        }
    }
    private async sendRegistrationMail(name:string,token:string,email:string){
        const url = `https://emergency-helper.herokuapp.com/api/Account/VerifyAccount/${token}`;
        const body = `Dear ${name},\n Thank you for registiring in Emergency Helper, in order to confirm your account please follow this link ${url}.\n Thanks \n Emergency Helper Team `
        const sendMail = new sendEmail();
        let response =  await sendMail.sendMail(email,"Emergency Helper Confirmation Required",body);
        return response;
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
    private validateToken =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
            if(request.headers['authorization']){
                jwt.verify(request.headers['authorization'].split(" ")[1],process.env.JWT_SECRET,(err,decoded)=>{
                if(err){
                    response.status(401).send({result:false});
                }
                else{
                    response.status(200).send({result:true});
                }
            });
            }
            else{
                response.status(401).send({result:false});
            }
    }
    private getAccount =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
            let account:IUser = await userModel.findById(request.user._id,' -password -categories -_id -createdAt -updatedAt -__v');
            let returnedAccount = account.toObject();
            returnedAccount.picture = account.picture.toString('base64');
            response.status(200).send(returnedAccount);
    }
    private verifyAccount =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        const token = request.params.verificationToken;
        jwt.verify(token,process.env.JWT_SECRET,async (err,decoded)=>{
            if(err){
                next(new SomethingWentWrongException());
            }
            else{
                await userModel.findOne({email:decoded['email']},async (err,user:IUser)=>{
                    if(err){
                        console.log(err);
                    }
                    else{
                        if(user.isApproved){
                            response.status(200).send("User Already Verified");
                        }
                        else{
                            user.isApproved = true;
                            await user.save((err)=>{
                                if(err){
                                    next(new SomethingWentWrongException());
                                }
                                else{
                                    response.status(201).send("Verified Successfully");
                                }
                            })
                        }
                    }
                })
            }
        });
    }
    private updateAccount = async (request:IRequestWithUser,response:express.Response,next:express.NextFunction)=>{
        let newData:any = request.body;
        if(newData.picture){
            newData.picture = Buffer.from(newData.picture,'base64');
        }
        let newUser = await userModel.findByIdAndUpdate(request.user._id,{$set:newData});
        if(newUser){
                response.status(200).send("Updated Successfuly");
            }
        else{
                next(new SomethingWentWrongException());
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
                    next(new SomethingWentWrongException())
                }else{
                    response.status(204).send("Password Updated Successfully");    
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
            }
            try{
                const verificationToken = jwt.sign({email:userData.email},process.env.JWT_SECRET);
                await model.create({
                    ...userData,
                    password:hashedPassword,
                    verificationToken:verificationToken
                },(err,user:IUser)=>{
                    if(err){
                        next(new SomethingWentWrongException());
                    }
                    else{
                        user.password = undefined;
                        if(this.sendRegistrationMail(user.name.firstName,user.verificationToken,user.email)){
                            response.status(201).send("Registered Successfully Verify Your Email!");
                        }
                        else{
                            response.status(201).send("Registered Successfully!");    
                        }
                    }
                });
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
                if(user.isApproved){
                    const tokenData = this.createToken(user);
                    response.status(200).send(tokenData); 
                }
                else{
                    if(this.sendRegistrationMail(user.name.firstName,user.verificationToken,user.email)){
                        next(new UserIsNotApprovedException(user.email));
                    }
                    else{
                        next(new SomethingWentWrongException());
                    }
                }
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