import * as bcrypt from 'bcrypt';
import * as express from 'express';
/////////////////////////////////////////
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
import IUser from '../interfaces/user/IUser';
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
/////////////////////////////////////////
import userModel from '../models/user/User';
/////////////////////////////////////////
import UpdatePasswordDTO from '../dto/UpdatePasswordDTO';
/////////////////////////////////////////
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import OldPasswordDosentMatchException from '../exceptions/account/OldPasswordDosentMatchException';
////////////////////////////////////////
import sendEmail from '../modules/sendEmail';
import TokenManager from '../modules/tokenManager';

class AccountController implements IController {
    public path:string;
    public router:express.IRouter;
    public tokenManager:TokenManager;
    public mailer:sendEmail;
    constructor(){
        this.path = '/Account';
        this.router = express.Router();
        this.initializeRoutes();
        this.tokenManager = new TokenManager();
        this.mailer = new sendEmail();
    }
    private initializeRoutes(){
        this.router.get(`${this.path}/ValidateToken`,this.validateToken);
        this.router.get(`${this.path}/VerifyAccount/:verificationToken`,this.verifyAccount);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}/ChangePassword`,authMiddleware,validationMiddleware(UpdatePasswordDTO),this.updatePassword);
    }
    private validateToken =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
            if(request.headers['authorization']){
                const token = request.headers['authorization'].split(" ")[1]
                this.tokenManager.validateToken(token).then(result=>{
                    response.status(200).send({result:true});
                }).catch(result=>{
                    response.status(401).send({result:false});
                })
            }
            else{
                response.status(401).send({result:false});
            }
    }
    private verifyAccount =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        const token = request.params.verificationToken;
        this.tokenManager.validateToken(token)
        .then(async decoded=>{
            await userModel.findOne({email:decoded['email']},async (err,user:IUser)=>{
                if(err){
                    next(err);
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
        }).catch(result=>{
            next(new SomethingWentWrongException());
        });
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
                    response.status(200).send("Password Updated Successfully");    
                }
            })
        }else{
            next(new OldPasswordDosentMatchException())
        }
    }
   
}
export default AccountController;
