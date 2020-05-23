import * as bcrypt from 'bcrypt';
import * as express from 'express';
/////////////////////////////////////////
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
import IUser from '../interfaces/user/IUser';
import IRequest from '../interfaces/request/IRequest'
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
/////////////////////////////////////////
import userModel from '../models/user/User';
import requestModel from '../models/request/Request'
/////////////////////////////////////////
import RequestDTO from '../dto/requestDTO/RequestDTO';
import CancelRequestDTO from '../dto/requestDTO/CancelRequestDTO';
/////////////////////////////////////////
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import OldPasswordDosentMatchException from '../exceptions/account/OldPasswordDosentMatchException';
////////////////////////////////////////
import sendEmail from '../modules/sendEmail';
import TokenManager from '../modules/tokenManager';
import Response from '../modules/Response';
import clientModel from './../models/user/Client';
import helperModel from './../models/user/Helper';
import WrongCredentialsException from './../exceptions/account/WrongCredentialsException';
import HttpException from './../exceptions/HttpException';
class RequestController implements IController {
    public path: string;
    public router: express.IRouter;
    constructor() {
        this.path = '/Request';
        this.router = express.Router();
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post(`${this.path}`, authMiddleware,validationMiddleware(RequestDTO), this.createRequest);
        this.router.post(`${this.path}/CancelRequest`, authMiddleware,validationMiddleware(CancelRequestDTO), this.cancelRequest);
        this.router.get(`${this.path}/ActiveRequest`, authMiddleware, this.getCurrentRequest);

    }
    private createRequest = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const newRequest:RequestDTO = request.body;
        await requestModel.create({...newRequest, client:request.user._id,date:new Date()})
        .then(async(req:IRequest)=>{
            if(req){
                request.user.requests.push(req._id)
                await request.user.save()
                .then(async(user:IUser)=>{
                    if(user){
                        response.status(201).send(new Response('Created Request Successfully').getData());
                    }
                    else{
                        await requestModel.findByIdAndRemove(req._id)
                        .then((req:IRequest)=>{
                            next(new SomethingWentWrongException("Couldn't Create Request At The Moment"))
                        })
                        .catch(err=>{
                            next(new SomethingWentWrongException(err))
                        })
                    }
                })
                .catch((err)=>{
                    next(new SomethingWentWrongException(err))
                })
            }
            else{
                next(new SomethingWentWrongException())
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
    }
    private cancelRequest = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const req:CancelRequestDTO = request.body;
        if(request.user.requests.includes(req._id)){
            await requestModel.findByIdAndUpdate(req._id,{ $set: {isCanceled: true }})
        .then((req:IRequest)=>{
            if(req){
                if(req.isCanceled){
                    response.status(200).send(new Response("Request Is Already Canceled").getData());
                    
                }
                else{
                    response.status(200).send(new Response("Canceled Request").getData());
                }
            }
            else{
                next(new HttpException(404,"Couldn't Cancel Request"))
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
        }
        else{
            next(new HttpException(400,"You Have No Request With That ID"))
        }
    }
    private getCurrentRequest = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await requestModel.findOne({isCanceled:false,_id:{$in:request.user.requests},finishedRequestID:null},'-createdAt -updatedAt -__v -supportTickets -client')
      .then((Request:IRequest)=>{
        if(Request){
            response.status(200).send(new Response(undefined,{...Request.toObject()}).getData());
        }
        else{
            next(new HttpException(404,"You Have No Active Request"))
        }
      })
      .catch(err=>{
          next(new SomethingWentWrongException(err))
      })
    }

}
export default RequestController;
