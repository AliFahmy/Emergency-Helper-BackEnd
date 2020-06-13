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
import { awsService } from '../middlewares/upload';
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
                                    if (helper.adminApproved) {
                                        const token = this.tokenManager.getToken({ _id: helper._id });
                                        response.status(200).send(new Response('Login Success', { token }).getData());
                                    }
                                    else {
                                        next(new HttpException(401, "Helper Is Not Approved By Admin Yet"))
                                    }
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
        console.log("file uploaded")
        if (files === undefined) {
            next(new SomethingWentWrongException('Error: No Files Selected!'))
        }
        else {
            await helperModel.findOne({ email: userData.email.toLowerCase() })
                .then(async (helper: IHelper) => {
                    if (helper) {
                        next(new UserWithThatEmailAlreadyExistsException(userData.email));
                    }
                    else {
                        await bcrypt.hash(userData.password, 10)
                            .then(async (hashedPassword: string) => {
                                await categoryModel.findOne({ 'name': userData.category }, '-createdAt -updatedAt -__v')
                                    .then(async (category: ICategory) => {
                                        if (category) {
                                            const verificationToken = this.tokenManager.getToken({ email: userData.email });
                                            await helperModel.create({
                                                ...userData,
                                                email: userData.email.toLowerCase(),
                                                location: {
                                                    type: "Point",
                                                    coordinates: [0, 0]
                                                },
                                                picture: files['profilePicture'][0].location,
                                                frontID: files['frontID'][0].location,
                                                backID: files['backID'][0].location,
                                                certificate: files['certificate'][0].location,
                                                password: hashedPassword,
                                                verificationToken: verificationToken
                                            })
                                                .then(async (helper: IHelper) => {
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
                                                        next(new SomethingWentWrongException());
                                                    }
                                                })
                                                .catch(err => {
                                                    next(new SomethingWentWrongException(err))
                                                })
                                        }
                                        else {
                                            next("Helper Category Dosen't Exist")
                                        }
                                    })
                                    .catch(err => {
                                        next(new SomethingWentWrongException(err))
                                    })
                            })
                    }
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
        let newData: updateHelperDTO = request.body;
        let newObj = newData;
        if (request.file) {
            const files = request.files as Express.Multer.File[];
            files['profilePicture'][0].location ? newObj['profilePicture'] = files['profilePicture'][0].location : null;
            files['frontID'][0].location ? newObj['frontID'] = files['frontID'][0].location : null;
            files['backID'][0].location ? newObj['backID'] = files['backID'][0].location : null;
            files['certificate'][0].location ? newObj['certificate'] = files['certificate'][0].location : null;
        }
        await helperModel
            .findByIdAndUpdate(request.user._id, { $set: newData })
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
    private viewNearByRequests = async (request: IRequestWithHelper, response: express.Response, next: express.NextFunction) => {
        const ViewNearbyRequestsDTO: ViewNearbyRequestsDTO = request.body
        let radius = 5;
        if (ViewNearbyRequestsDTO.radius) {
            radius = ViewNearbyRequestsDTO.radius
        }
        await requestModel.find(
            {
                location: {
                    $geoWithin: {
                        $centerSphere: [[request.user.location.coordinates[0], request.user.location.coordinates[1]], radius / 3963.2]
                    }
                },
                "canceledState.isCanceled": false
            },
            '-canceledState -finishedState -offers -supportTickets -createdAt -updatedAt -acceptedState -__v'
        )
            .then((requests: IRequest[]) => {
                response.status(200).send(new Response(undefined, { requests }).getData());
            })
            .catch(err => {
                console.log(err)
                next(new SomethingWentWrongException(err))
            })
    }
}

export default HelperController;