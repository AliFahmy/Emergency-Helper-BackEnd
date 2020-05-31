import * as express from 'express';
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
import IUser from '../interfaces/user/IUser';
import IRequest from '../interfaces/request/IRequest'
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
/////////////////////////////////////////
import requestModel from '../models/request/Request'
/////////////////////////////////////////
import RequestDTO from '../dto/requestDTO/RequestDTO';
import MakeOfferDTO from './../dto/requestDTO/MakeOfferDTO';
import CancelRequestDTO from '../dto/requestDTO/CancelRequestDTO';
/////////////////////////////////////////
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import HttpException from './../exceptions/HttpException';
////////////////////////////////////////
import Response from '../modules/Response';
import AcceptOfferDTO from './../dto/requestDTO/AcceptOfferDTO';
import helperModel from './../models/user/Helper';
import IHelper from './../interfaces/user/IHelper';
import acceptedRequestModel from './../models/request/AcceptedRequest';
import IAcceptedRequest from './../interfaces/request/IAcceptedRequest';

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
        this.router.post(`${this.path}/MakeOffer`, authMiddleware,validationMiddleware(MakeOfferDTO), this.makeOffer);
        this.router.post(`${this.path}/AcceptOffer`, authMiddleware,validationMiddleware(AcceptOfferDTO), this.acceptOffer);
        ///////////////////////////////////////////////////////////////////////////////////////////
        this.router.get(`${this.path}/ActiveRequest`, authMiddleware, this.getCurrentRequest);
        this.router.get(`${this.path}/ViewOffers`, authMiddleware, this.viewOffers);
    }
    private createRequest = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const newRequest:RequestDTO = request.body;
        if(request.user.activeRequest){
           next(new HttpException(404,"Cant Create Request You Already Have Active One")) 
        }
        else{
            await requestModel.create({...newRequest, client:request.user._id,date:new Date()})
        .then(async(req:IRequest)=>{
            if(req){
                request.user.requests.push(req._id)
                request.user.activeRequest = req._id
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
    }
    private cancelRequest = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const req:CancelRequestDTO = request.body;
        if(request.user.requests.includes(req._id)&&request.user.activeRequest !== req._id){
            await requestModel.findByIdAndUpdate(req._id,{ $set: {isCanceled: true }})
        .then(async(req:IRequest)=>{
            if(req){
                if(req.isCanceled){
                    response.status(200).send(new Response("Request Is Already Canceled").getData()); 
                }
                else{
                    request.user.activeRequest = undefined;
                    await request.user.save()
                    .then((user:IUser)=>{
                        if(user){
                            response.status(200).send(new Response("Canceled Request").getData());
                        }
                        else{
                            next(new HttpException(400,"Couldnt Save User"))
                        }
                    })
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
    private async getActiveRequest(user:IUser):Promise<IRequest>{
        return new Promise<IRequest>(async(resolve,reject)=>{
            await requestModel.findById(user.activeRequest,'-createdAt -updatedAt -__v -supportTickets -client')
          .then((Request:IRequest)=>{
            resolve(Request);
          })
          .catch(err=>{
                reject(err)
            }) 
        })
    }
    private getCurrentRequest = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await this.getActiveRequest(request.user)
        .then((req:IRequest)=>{
            if(req){
                response.status(200).send(new Response(undefined,{...req.toObject()}).getData());
            }
            else{
                next(new HttpException(404,"User Has No Active Request"))
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
    }
    private makeOffer = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const offer:MakeOfferDTO = request.body;
        if(request.user.role==="Helper"){
        await requestModel.findById(offer.requestID)
        .then(async(req:IRequest)=>{
            if(req){
                req.offers.push({helperID:request.user._id,price:offer.price,description:offer.description});
                await req.save()
                .then((req:IRequest)=>{
                    if(req){
                        response.status(200).send(new Response("Submited Offer Successfully").getData());
                    }
                    else{
                        next(new HttpException(400,"Failed To Make Offer, Please try again later."))
                    }
                })
                .catch(err=>{
                    next(new SomethingWentWrongException(err))
                })
            }
            else{
                next(new HttpException(404,"This Request No Longer Exists"))
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
        }
        else{
            next(new HttpException(401,"Only Helpers Are Allowed To Make Offers"))
        }
        
    }
    private async getHelperInformationById(id:string):Promise<object>{
        return new Promise<object>(async(resolve,reject)=>{
            await helperModel.findById(id)
            .then((helper:IHelper)=>{
                if(helper){
                    const helperInfo = {
                        profilePicture: helper.profilePicture,
                        name:helper.firstName,
                        skills:helper.skills,
                        category:helper.category
                    }
                    resolve(helperInfo)
                }
                else{
                    resolve(null)
                }
            })
            .catch(err=>{
                reject(err)
            })
        })
    }
    private viewOffers = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        await this.getActiveRequest(request.user)
        .then(async(req:IRequest)=>{
            if(req){
                let offers=[]
            for(let i=0;i<req.offers.length;i++){
                await this.getHelperInformationById(req.offers[i].helperID)
                .then((helperInfo)=>{
                    offers.push({
                        helperInfo,
                        offer:req.offers[i]
                    })
                })
            }
                    response.status(200).send(new Response(undefined,{offers}).getData());
            }
            else{
                next(new HttpException(404,"User Has No Active Request"))
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
    }
    private acceptOffer = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const offer:AcceptOfferDTO = request.body;
        await requestModel.findById(request.user.activeRequest)
        .then(async (req:IRequest)=>{
            if(req){
                for(let i=0;i<req.offers.length;i++){
                    if(req.offers[i]._id.toString() === offer.offerID){
                        if(req.offers[i].isAccepted){
                            response.status(200).send(new Response("Offer Is Already Accepted!").getData());
                            return;
                        }
                        else{
                            await helperModel.findById(req.offers[i].helperID)
                                .then(async (helper:IHelper)=>{
                                    if(helper){
                                        helper.activeRequest = req._id
                                        await helper.save()
                                        .then(async(helper:IHelper)=>{
                                            await acceptedRequestModel.create({request:req._id,helper:helper._id,price:req.offers[i].price})
                                            .then(async(acceptedRequest:IAcceptedRequest)=>{
                                                req.offers[i].isAccepted = true;
                                                req.acceptedRequestID = acceptedRequest._id
                                                await req.save()
                                                .then((updatedRequest:IRequest)=>{
                                                    if(updatedRequest){
                                                     response.status(200).send(new Response("Offer Accepted, You Will Be Connected With Your Helper As Soon As Possible").getData());  
                                                    }
                                                    else{
                                                        next(new HttpException(400,"Could'nt Accept offer"))
                                                    }
                                                })
                                                .catch(err=>{
                                                    next(new SomethingWentWrongException(err))
                                                })
                                            })
                                            .catch(err=>{
                                                next(new SomethingWentWrongException(err))
                                            })
                                        })
                                        .catch(err=>{
                                            next(new SomethingWentWrongException(err))
                                        })
                                    }
                                    else{
                                        next(new HttpException(404,"Couldnt Find Helper"))
                                    }
                                })
                                .catch(err=>{
                                    next(new SomethingWentWrongException(err))
                                })
                        }
                        return;
                    } 
                }
                next(new HttpException(404,"This Offer No Longer Exists"))
            }
            else{
                next(new HttpException(404,"This Request No Longer Exists"))
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
    }

}
export default RequestController;
