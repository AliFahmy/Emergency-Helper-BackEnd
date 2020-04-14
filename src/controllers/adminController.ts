import * as express from 'express';
import * as bcrypt from 'bcrypt';
////////////////////////////////////////////////////
import IController from '../interfaces/IController';
import IClient from '../interfaces/user/IClient';
import IRequestWithUser from 'interfaces/httpRequest/IRequestWithUser';
////////////////////////////////////////////////////
import authMiddleware from '../middlewares/auth';
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
        this.router.get(`${this.path}/GetPendingHelpers`, authMiddleware, adminMiddleware, this.getPendingHelpers)
        this.router.get(`${this.path}/GetAllHelpers`, authMiddleware, adminMiddleware, this.getAllHelpers)
        this.router.get(`${this.path}/GetAllClients`, authMiddleware, adminMiddleware, this.getAllClients)
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.post(`${this.path}/Login`, validationMiddleware(LogInDto), this.login);
        this.router.post(`${this.path}/ApproveHelper`, authMiddleware, adminMiddleware, this.approveHelper);
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.delete(`${this.path}/DeleteUser/:id`, authMiddleware, adminMiddleware, this.deleteUser)
    }
    private login = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const logInData: LogInDto = request.body;
        const user = await adminModel.findOne({ email: logInData.email });
        if (user) {
            const isPasswordMatching = await bcrypt.compare(logInData.password, user.password);
            if (isPasswordMatching) {
                user.password = undefined;
                const token = this.tokenManager.getToken({ _id: user._id });
                response.status(200).send(new Response('Login Success', { token }).getData());
            }
            else {
                next(new WrongCredentialsException());
            }
        }
        else {
            next(new WrongCredentialsException());
        }
    }
    private getPendingHelpers = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await helperModel.find({ isApproved: false }, '-password -createdAt -updatedAt -__v', (err, helpers) => {
            if (err) {
                next(new SomethingWentWrongException());
            }
            else {
                response.status(200).send(new Response(undefined, { helpers }).getData());
            }
        })
    }
    private deleteUser = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const userID = request.params.id;
        console.log(userID)
        await userModel.findOneAndRemove({ _id: userID }, (err) => {
            if (err) {
                next(new SomethingWentWrongException())
            }
            else {
                response.status(200).send(new Response('User Deleted Successfully').getData());

            }
        })
    }
    private getAllClients = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await clientModel.find({}, '-password -createdAt -updatedAt -__v', (err, clients: IClient[]) => {
            if (err) {
                next(new SomethingWentWrongException());
            }
            else {
                let returnedClients = [];
                for (let i = 0; i < clients.length; i++) {
                    const newClient = clients[i].toObject();
                    newClient.picture ? newClient.picture = newClient.picture.toString('base64') : null;
                    returnedClients.push(newClient);
                }
                response.status(200).send(new Response(undefined, { clients }).getData());
            }
        })
    }
    private getAllHelpers = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await helperModel.find({}, '-password -createdAt -updatedAt -__v', (err, helpers) => {
            if (err) {
                next(new SomethingWentWrongException());
            }
            else {
                response.status(200).send(new Response(undefined, { helpers }).getData());
            }
        })
    }
    private approveHelper = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const helperID = request.body.id;
        const helper = await helperModel.findById(helperID);
        if (helper) {
            helper.isApproved = true;
            await helper.save((err) => {
                if (err) {
                    next(new SomethingWentWrongException());
                }
                else {
                    response.status(200).send(new Response('Helper Approved').getData());
                }
            });
        }
        else {
            next(new SomethingWentWrongException());
        }
    }
}

export default AdminController;