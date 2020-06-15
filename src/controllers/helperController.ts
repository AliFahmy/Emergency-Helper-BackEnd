import * as express from 'express';
import * as bcrypt from 'bcrypt';
////////////////////////////////////////////////////
import IController from '../interfaces/IController';
import ICategory from './../interfaces/ICategory';
import IHelper from '../interfaces/user/IHelper';
import IRequest from '../interfaces/request/IRequest';
////////////////////////////////////////////////////
import authMiddleware from '../middlewares/auth';
import validationMiddleware from '../middlewares/validation';
import { awsService, deleteFiles } from '../middlewares/upload';
///////////////////////////////////////////////////
import categoryModel from '../models/Category';
import helperModel from '../models/user/Helper';
////////////////////////////////////////////////////
import CategoryDTO from '../dto/categoryDTO';
import LogInDto from './../dto/loginDTO';
import updateHelperDTO from './../dto/helperDTO/updateHelperDTO';
import HelperRegistrationDTO from '../dto/helperDTO/helperRegistrationDTO';
////////////////////////////////////////////////////
import HttpException from '../exceptions/HttpException';
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import UserIsNotApprovedException from '../exceptions/account/UserIsNotApprovedException';
import UserWithThatEmailAlreadyExistsException from '../exceptions/account/UserWithThatEmailAlreadyExistsException';
import HelperCategoryAlreadyExistsException from '../exceptions/helper/HelperCategoryAlreadyExistsException';
import WrongCredentialsException from '../exceptions/account/WrongCredentialsException';
////////////////////////////////////////////////////
import sendEmail from '../modules/sendEmail';
import TokenManager from '../modules/tokenManager';
import Response from '../modules/Response';
import IRequestWithHelper from './../interfaces/httpRequest/IRequestWithHelper';
import requestOfferModel from './../models/request/RequestOffer';
import IRequestOffer from './../interfaces/request/IRequestOffer';
import ViewNearbyRequestsDTO from './../dto/requestDTO/viewNearByRequestsDTO';
import requestModel from '../models/request/Request'
import LocationDTO from './../dto/locationDTO';
import ILocation from './../interfaces/ILocation';
import FillReceiptDTO from './../dto/requestDTO/FillReceiptDTO';
import { IsNotEmptyObject } from 'class-validator';
import clientModel from './../models/user/Client';
import IClient from './../interfaces/user/IClient';

class HelperController implements IController {
    public path: string;
    public router: express.IRouter;
    private tokenManager: TokenManager;
    private mailer: sendEmail;
    constructor() {
        this.path = '/Helper';
        this.router = express.Router();
        this.tokenManager = new TokenManager();
        this.mailer = new sendEmail();
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.get(`${this.path}/AllCategories`, this.getAllCategories);
        this.router.get(`${this.path}`, authMiddleware, this.getAccount);
        this.router.get(`${this.path}/CurrentOffer`, authMiddleware, this.getCurrentOffer);
        this.router.get(`${this.path}/HelperStatus`, authMiddleware, this.getHelperStatus);

        ////////////////////////////////////////////////////////////////////
        this.router.post(`${this.path}/Login`, validationMiddleware(LogInDto), this.login);
        this.router
            .post(`${this.path}/Register`,
                awsService.fields([{ name: 'frontID', maxCount: 1 }, { name: 'backID', maxCount: 1 }, { name: 'profilePicture', maxCount: 1 }, { name: 'certificate', maxCount: 1 }]),
                validationMiddleware(HelperRegistrationDTO),
                this.register);
        this.router.post(`${this.path}/Category`, validationMiddleware(CategoryDTO), this.insertCategory);
        this.router.post(`${this.path}/ToggleStatus`, authMiddleware, this.toggleState);
        this.router.post(`${this.path}/ViewNearbyRequests`, authMiddleware, validationMiddleware(ViewNearbyRequestsDTO, true), this.viewNearByRequests);
        this.router.post(`${this.path}/FillReciept`, authMiddleware, validationMiddleware(FillReceiptDTO), this.fillReceipt);
        
        ////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}/Location`, authMiddleware, validationMiddleware(LocationDTO), this.updateLocation)
        this.router.patch(`${this.path}`, authMiddleware, awsService.fields([{ name: 'frontID', maxCount: 1 }, { name: 'backID', maxCount: 1 }, { name: 'profilePicture', maxCount: 1 }, { name: 'certificate', maxCount: 1 }]), validationMiddleware(updateHelperDTO, true), this.updateAccount);
    }
    private getAllCategories = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        await categoryModel.find({}, '-_id -createdAt -updatedAt -__v')
            .then((categories: ICategory[]) => {
                if (categories) {
                    response.status(200).send(new Response(undefined, { categories }).getData());
                }
                else {
                    next(new SomethingWentWrongException())
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }
    private insertCategory = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const categoryDTO: CategoryDTO = request.body;
        await categoryModel.findOne({ name: categoryDTO.name })
            .then(async (category: ICategory) => {
                if (category) {
                    next(new HelperCategoryAlreadyExistsException());
                }
                else {
                    await categoryModel.create(categoryDTO)
                        .then((category: ICategory) => {
                            if (category) {
                                response.status(201).send(new Response('Created Category Successfully').getData());
                            }
                            else {
                                next(new SomethingWentWrongException());
                            }
                        })
                        .catch(err => {
                            next(new SomethingWentWrongException(err))
                        })
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }
    private fillReceipt = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        const items : FillReceiptDTO = request.body;
        await requestModel.findByIdAndUpdate(request.user.activeRequest,{"finishedState.items":items, "finishedState.isFinished":true})
        .then((request:IRequest)=>{
            if(request){
                response.status(200).send(new Response("Filled Receipt Successfully").getData());
            }
            else{
                new HttpException(404,"Request No Longer Exists")
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
    }
    private login = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const logInData: LogInDto = request.body;
        await helperModel.findOne({ email: logInData.email })
            .then(async (helper: IHelper) => {
                if (helper) {
                    await bcrypt.compare(logInData.password, helper.password)
                        .then(async (isPasswordMatching: boolean) => {
                            if (isPasswordMatching) {
                                helper.password = undefined;
                                if (helper.isApproved) {
                                        const token = this.tokenManager.getToken({ _id: helper._id });
                                        response.status(200).send(new Response('Login Success', { token }).getData());    
                                }
                                else {
                                    await this.mailer.sendRegistrationMail(helper.firstName, helper.verificationToken, helper.email, helper.role)
                                        .then((sent: boolean) => {
                                            if (sent) {
                                                next(new UserIsNotApprovedException(helper.email))
                                            }
                                            else {
                                                next(new SomethingWentWrongException())
                                            }
                                        })
                                        .catch(err => {
                                            next(new SomethingWentWrongException(err))
                                        })
                                }
                            }
                            else {
                                next(new WrongCredentialsException())
                            }
                        })
                }
            })
            .catch((err => {
                next(new SomethingWentWrongException(err))
            }))
    }
    private register = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const userData: HelperRegistrationDTO = request.body;
        const files = request.files as Express.Multer.File[];
        const filesLinks = []
        if (files === undefined) {
            next(new SomethingWentWrongException('Error: No Files Selected!'))
        }
        else {
            for(let i=0;i<files.length;i++){
                filesLinks.push(files[i][0].location)
            }
            await helperModel.findOne({ email: userData.email.toLowerCase() })
                .then(async (helper: IHelper) => {
                    if (helper) {
                        deleteFiles(filesLinks)
                        next(new UserWithThatEmailAlreadyExistsException(userData.email));
                    }
                    else {
                                await categoryModel.findOne({ 'name': userData.category }, '-createdAt -updatedAt -__v')
                                    .then(async (category: ICategory) => {
                                        if (category) {
                                            await helperModel.create({
                                                ...userData,
                                                profilePicture: files['profilePicture'][0].location,
                                                frontID: files['frontID'][0].location,
                                                backID: files['backID'][0].location,
                                                certificate: files['certificate'][0].location,
                                                location:{
                                                    type:"Point",
                                                    coordinates:[0,0]
                                                }
                                            }).then(async (helper: IHelper) => {
                                                    if (helper) {
                                                        await this.mailer.sendRegistrationMail(helper.firstName, helper.verificationToken, helper.email, helper.role)
                                                            .then((sent: boolean) => {
                                                                if (sent) {
                                                                    response.status(201).send(new Response("Helper Registered Successfully \n Please Verify Your Email!").getData());
                                                                }
                                                                else {
                                                                    response.status(201).send(new Response('Helper Registered Successfully!').getData());
                                                                }
                                                            })
                                                            .catch(err => {
                                                                next(new SomethingWentWrongException(err))
                                                            })
                                                    }
                                                    else {
                                                        deleteFiles(filesLinks)
                                                        next(new SomethingWentWrongException());
                                                    }
                                                })
                                                .catch(err => {
                                                    deleteFiles(filesLinks)
                                                    next(new SomethingWentWrongException(err))
                                                })
                                        }
                                        else {
                                            deleteFiles(filesLinks)
                                            next(new HttpException(404,"Category Not Found"))
                                        }
                                    })
                                    .catch(err => {
                                        deleteFiles(filesLinks)
                                        next(new SomethingWentWrongException(err))
                                    })
                            
                    }
                })
                .catch(err=>{
                    deleteFiles(filesLinks)
                    next(new SomethingWentWrongException(err))
                })
        }
    }
    private getAccount = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        response.status(200).send(new Response(undefined, { ...request.user.toObject() }).getData());
    }
    private getCurrentOffer = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        if (request.user.currentOffer) {
            await requestOfferModel.findById(request.user.currentOffer, '-helperID -createdAt -updatedAt -__v')
                .then((offer: IRequestOffer) => {
                    if (offer) {
                        response.status(200).send(new Response(undefined, { ...offer.toObject() }).getData());
                    }
                })
                .catch(err => {
                    next(new SomethingWentWrongException(err))
                })
        }
        else {
            response.status(404).send(new Response("Helper Dosent Have Current Offer").getData());
        }
    }
    private getHelperStatus = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        response.status(200).send(new Response(undefined, { status: request.user.isActive }).getData());
    }
    private updateAccount = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        if(Object.keys(request.body).length || request.files){
        let newData: updateHelperDTO = request.body;
        let newObj = newData;
        const files = request.files as Express.Multer.File[];
        if (Object.keys(request.files).length) {
            files['profilePicture'] ? newObj['profilePicture'] = files['profilePicture'][0].location : null;
            files['frontID'] ? newObj['frontID'] = files['frontID'][0].location : null;
            files['backID'] ? newObj['backID'] = files['backID'][0].location : null;
            files['certificate'] ? newObj['certificate'] = files['certificate'][0].location : null;
        }
        const proffesionEdit : boolean = newData.category || newData.skills || files['certificate'] ||files['frontID'] || files['backID'];
        await helperModel
            .findByIdAndUpdate(request.user._id, { $set: newData,adminApproved : !proffesionEdit })
            .then((helper: IHelper) => {
                if (helper) {
                    response.status(200).send(new Response('Updated Successfuly!').getData());
                }
                else {
                    next(new SomethingWentWrongException());
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException())
            })
        }
        else{
            next(new HttpException(400,"Enter at least one field to update"))
        }
    }
    private toggleState = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        request.user.isActive = !request.user.isActive;
        await request.user.save().then((helper: IHelper) => {
            if (helper) {
                response.status(200).send(new Response('Toggeled Successfuly!').getData());
            }
        })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }
    private updateLocation = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        const location: LocationDTO = request.body;
        request.user.location.coordinates = [location.longitude, location.latitude]
        await request.user.save()
            .then((helper: IHelper) => {
                if (helper) {
                    response.status(200).send(new Response('Updated Location Successfuly!').getData());
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }
    private arePointsNear(checkPoint:ILocation, centerPoint:ILocation, km:number) {
        var ky = 40000 / 360;
        var kx = Math.cos(Math.PI * centerPoint.coordinates[1] / 180.0) * ky;
        var dx = Math.abs(centerPoint.coordinates[0] - checkPoint.coordinates[0]) * kx;
        var dy = Math.abs(centerPoint.coordinates[1] - checkPoint.coordinates[1]) * ky;
        return Math.sqrt(dx * dx + dy * dy) <= km;
    }
    private viewNearByRequests = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        if(request.user.isApproved){
            const helperLocation:LocationDTO = request.body
            request.user.location.coordinates = [helperLocation.longitude,helperLocation.latitude]
            await requestModel.find(
                {
                    "canceledState.isCanceled":false,
                    category:request.user.category
                },
                '-canceledState -finishedState -offers -supportTickets -createdAt -updatedAt -acceptedState -__v'
            )
            .then(async(requests:IRequest[])=>{
                const nearbyRequests = []
                for(let i=0;i<requests.length;i++){
                    if(this.arePointsNear(request.user.location,requests[i].location,requests[i].radius)){
                        nearbyRequests.push(requests[i]);
                    }
                }
                for(let i=0;i<nearbyRequests.length;i++){
                    await clientModel.findById(nearbyRequests[i].client)
                    .then((client:IClient)=>{
                        if(client){
                            nearbyRequests[i] = {
                                ...nearbyRequests[i].toObject(),
                                clientName:client.firstName,
                                clientPicture:client.profilePicture
                            } 
                        }
                    })
                }
                response.status(200).send(new Response(undefined,{requests:nearbyRequests,category:request.user.category}).getData());
            })
            .catch(err=>{
                next(new SomethingWentWrongException(err))
            })
        }
        else{
            next(new HttpException(401,"Admin Didnt Approve Your Information Yet."))
        }
        
    }
}

export default HelperController;