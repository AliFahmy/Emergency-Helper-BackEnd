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
import Response from '../modules/Response';
class AccountController implements IController {
    public path: string;
    public router: express.IRouter;
    public tokenManager: TokenManager;
    public mailer: sendEmail;
    constructor() {
        this.path = '/Account';
        this.router = express.Router();
        this.initializeRoutes();
        this.tokenManager = new TokenManager();
        this.mailer = new sendEmail();
    }
    private initializeRoutes() {
        this.router.get(`${this.path}/ValidateToken`, authMiddleware, this.validateToken);
        this.router.get(`${this.path}/VerifyAccount/:verificationToken`, this.verifyAccount);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}/ChangePassword`, authMiddleware, validationMiddleware(UpdatePasswordDTO), this.updatePassword);
        /////////////////////////////////////////////////////////////////////
    }
    private validateToken = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        response.status(200).send(new Response(undefined, { result: true }).getData());
    }
    private verifyAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const token = request.params.verificationToken;
        this.tokenManager.validateToken(token)
            .then(async decoded => {
                await userModel.findOne({ email: decoded['email'] }, async (err, user: IUser) => {
                    if (err) {
                        next(err);
                    }
                    else {
                        if (user.isApproved){
                            response.status(200).send(new Response('User Already Verified!').getData());
                        }
                        else {
                            user.isApproved = true;
                            await user.save((err) => {
                                if (err) {
                                    next(new SomethingWentWrongException());
                                }
                                else {
                                    response.status(201).send(new Response('Verified Successfully!').getData());
                                }
                            })
                        }
                    }
                })
            }).catch(result => {
                next(new SomethingWentWrongException());
            });
    }
    private updatePassword = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        let newPassword: UpdatePasswordDTO = request.body;
        let User = await userModel.findById(request.user._id);
        const isPasswordMatching = await bcrypt.compare(newPassword.oldPassword, User.password);
        if (isPasswordMatching) {
            User.password = await bcrypt.hash(newPassword.newPassword, 10);
            await User.save((err) => {
                if (err) {
                    next(new SomethingWentWrongException())
                } else {
                    response.status(200).send(new Response('Password Updated Successfully!').getData());
                }
            })
        } else {
            next(new OldPasswordDosentMatchException())
        }
    }
}
export default AccountController;
