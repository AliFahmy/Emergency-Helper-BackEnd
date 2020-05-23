import * as express from 'express';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
////////////////////////////////////////////////////
import IController from '../interfaces/IController';
import ICategory from './../interfaces/ICategory';
import IHelper from '../interfaces/user/IHelper';
import IRequestWithUser from 'interfaces/httpRequest/IRequestWithUser';
////////////////////////////////////////////////////
import authMiddleware from '../middlewares/auth';
import validationMiddleware from '../middlewares/validation';
import {awsService} from '../middlewares/upload';
///////////////////////////////////////////////////
import categoryModel from '../models/Category';
import helperModel from '../models/user/Helper';

////////////////////////////////////////////////////

import CategoryDTO from '../dto/categoryDTO';
import LogInDto from './../dto/loginDTO';
import updateHelperDTO from './../dto/helperDTO/updateHelperDTO';
import HelperRegistrationDTO from '../dto/helperDTO/helperRegistrationDTO';
////////////////////////////////////////////////////
import WrongCredentialsException from '../exceptions/account/WrongCredentialsException';
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import UserIsNotApprovedException from '../exceptions/account/UserIsNotApprovedException';
import UserWithThatEmailAlreadyExistsException from '../exceptions/account/UserWithThatEmailAlreadyExistsException';
import HelperCategoryAlreadyExistsException from '../exceptions/helper/HelperCategoryAlreadyExistsException';
////////////////////////////////////////////////////
import sendEmail from '../modules/sendEmail';
import TokenManager from '../modules/tokenManager';
import Response from '../modules/Response';


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
        ////////////////////////////////////////////////////////////////////
        this.router.post(`${this.path}/Login`, validationMiddleware(LogInDto), this.login);
        this.router
        .post(`${this.path}/Register`,
        awsService.fields([{name:'frontID',maxCount:1},{name:'backID',maxCount:1},{name:'profilePicture',maxCount:1},{name:'certificate',maxCount:1}]),
        validationMiddleware(HelperRegistrationDTO), 
        this.register);

        this.router.post(`${this.path}/Category`, validationMiddleware(CategoryDTO), this.insertCategory);
        ////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}`, authMiddleware, validationMiddleware(updateHelperDTO, true), this.updateAccount);
    }
    private getAllCategories = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        await categoryModel.find({}, '-_id -createdAt -updatedAt -__v')
        .then((categories:ICategory[])=>{
            if(categories){
                response.status(200).send(new Response(undefined, { categories }).getData());
            }
            else{
                next(new SomethingWentWrongException())
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
    }
    private insertCategory = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const categoryDTO: CategoryDTO = request.body;
        await categoryModel.findOne({ name: categoryDTO.name })
        .then(async(category:ICategory)=>{
            if(category){
                next(new HelperCategoryAlreadyExistsException());        
            }
            else{
                await categoryModel.create(categoryDTO)
                .then((category:ICategory)=>{
                    if(category){
                        response.status(201).send(new Response('Created Category Successfully').getData());
                    }
                    else{
                        next(new SomethingWentWrongException());
                    }
                })
                .catch(err=>{
                    next(new SomethingWentWrongException(err))
                })
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err))
        })
    }
    private login = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const logInData: LogInDto = request.body;
        await helperModel.findOne({ email: logInData.email })
        .then(async (helper:IHelper)=>{
            if(helper){
                await bcrypt.compare(logInData.password, helper.password)
                .then(async (isPasswordMatching:boolean)=>{
                    if(isPasswordMatching){
                        helper.password = undefined;
                        if (helper.isApproved) {
                            const token = this.tokenManager.getToken({ _id: helper._id });
                            response.status(200).send(new Response('Login Success', { token }).getData());
                        }
                        else{
                            await this.mailer.sendRegistrationMail(helper.firstName, helper.verificationToken, helper.email,helper.role)
                            .then((sent:boolean)=>{
                                if(sent){
                                    next(new UserIsNotApprovedException(helper.email))
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
                })
            }
        })
        .catch((err=>{
            next(new SomethingWentWrongException(err))
        }))
    }
    private register = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const userData: HelperRegistrationDTO = request.body;
        const files = request.files as Express.Multer.File[];
        console.log("file uploaded")
        if(files === undefined){
            next(new SomethingWentWrongException('Error: No Files Selected!'))
        }
        else{
            await helperModel.findOne({ email: userData.email })
            .then(async(helper:IHelper)=>{
                if(helper){
                    next(new UserWithThatEmailAlreadyExistsException(userData.email));
                }
                else{
                    await bcrypt.hash(userData.password, 10)
                    .then(async (hashedPassword:string)=>{
                        await categoryModel.findOne({ 'name': userData.category }, '-createdAt -updatedAt -__v')
                        .then(async(category:ICategory)=>{
                            if(category){
                                const verificationToken = this.tokenManager.getToken({ email: userData.email });
                                await helperModel.create({
                                    ...userData,
                                    picture: files['profilePicture'][0].location,
                                    frontID: files['frontID'][0].location,
                                    backID: files['backID'][0].location,
                                    certificate: files['certificate'][0].location,
                                    password: hashedPassword,
                                    verificationToken: verificationToken
                                })
                                .then(async (helper:IHelper)=>{
                                    if(helper){
                                        await this.mailer.sendRegistrationMail(helper.firstName, helper.verificationToken, helper.email,helper.role)
                                        .then((sent:boolean)=>{
                                            if(sent){
                                                response.status(201).send(new Response("Helper Registered Successfully \n Please Verify Your Email!").getData());
                                            }
                                            else{
                                                response.status(201).send(new Response('Helper Registered Successfully!').getData());
                                            }
                                        })
                                        .catch(err=>{
                                            next(new SomethingWentWrongException(err))
                                        })
                                    }
                                    else{
                                        next(new SomethingWentWrongException());
                                    }
                                })
                                .catch(err=>{
                                    next(new SomethingWentWrongException(err))
                                })
                            }   
                            else{
                                next("Helper Category Dosen't Exist")
                            }
                        })
                        .catch(err=>{
                            next(new SomethingWentWrongException(err))
                        })
                })
            }
        })
    }
    }
    private getAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        response.status(200).send(new Response(undefined, {...request.user}).getData());
    }
    private updateAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        let newData: updateHelperDTO = request.body;
        let newObj = newData;
        request.file ? newObj['profilePicture'] = request.file['location'] : null;
        await helperModel.findByIdAndUpdate(request.user._id, { $set: newData })
        .then((helper:IHelper)=>{
            if(helper){
                response.status(200).send(new Response('Updated Successfuly!').getData());
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

export default HelperController;