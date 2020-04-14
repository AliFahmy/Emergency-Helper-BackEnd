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
        this.router.post(`${this.path}/Register`, validationMiddleware(HelperRegistrationDTO), this.register);
        this.router.post(`${this.path}/Category`, validationMiddleware(CategoryDTO), this.insertCategory);
        ////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}`, authMiddleware, validationMiddleware(updateHelperDTO, true), this.updateAccount);
    }
    private getAllCategories = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        await categoryModel.find({}, '-_id -createdAt -updatedAt -__v', (err, categories) => {
            if (err) {
                next(new SomethingWentWrongException());
            }
            else {
                response.status(200).send(new Response(undefined, { categories }).getData());
            }
        })
    }
    private insertCategory = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const categoryDTO: CategoryDTO = request.body;
        if (await categoryModel.findOne({ name: categoryDTO.name })) {
            next(new HelperCategoryAlreadyExistsException());
        }
        else {
            await categoryModel.create(categoryDTO, (err: any, category: ICategory) => {
                if (err) {
                    next(new SomethingWentWrongException());
                }
                else {
                    response.status(201).send(new Response('Created Category Successfully').getData());
                }
            })
        }
    }
    private login = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const logInData: LogInDto = request.body;
        const user = await helperModel.findOne({ email: logInData.email });
        if (user) {
            const isPasswordMatching = await bcrypt.compare(logInData.password, user.password);
            if (isPasswordMatching) {
                user.password = undefined;
                if (user.isApproved) {
                    const token = this.tokenManager.getToken({ _id: user._id });
                    response.status(200).send(new Response('Login Success', { token }).getData());
                }
                else {
                    if (this.mailer.sendRegistrationMail(user.name.firstName, user.verificationToken, user.email)) {
                        next(new UserIsNotApprovedException(user.email));
                    }
                    else {
                        next(new SomethingWentWrongException());
                    }
                }
            }
            else {
                next(new WrongCredentialsException());
            }
        }
        else {
            next(new WrongCredentialsException());
        }
    }
    private register = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const userData: HelperRegistrationDTO = request.body;
        if (await helperModel.findOne({ email: userData.email })) {
            next(new UserWithThatEmailAlreadyExistsException(userData.email));
        }
        else {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            let categoriesid = [];
            await categoryModel.find({ 'name': { $in: userData.categories } }, '-name -createdAt -updatedAt -__v', (err, categories: ICategory[]) => {
                if (err) {
                    next(new SomethingWentWrongException());
                }
                else {
                    for (let i = 0; i < categories.length; i++) {
                        categoriesid.push(categories[i]._id);
                    }
                }
            });
            // negrb ne3ml middleware yehwl kol al base64 le buffer 
            try {
                const verificationToken = this.tokenManager.getToken({ email: userData.email });
                await helperModel.create({
                    ...userData,
                    picture: Buffer.from(userData.picture, 'base64'),
                    frontID: Buffer.from(userData.frontID, 'base64'),
                    backID: Buffer.from(userData.backID, 'base64'),
                    certificate: Buffer.from(userData.certificate, 'base64'),
                    categories: categoriesid,
                    password: hashedPassword,
                    verificationToken: verificationToken
                }, async (err: any, helper: IHelper) => {
                    if (err) {
                        next(new SomethingWentWrongException());
                    }
                    else {
                        if (this.mailer.sendRegistrationMail(helper.name.firstName, helper.verificationToken, helper.email)) {
                            response.status(201).send(new Response('Helper Registered Successfully\nPlease Verify Your Email!').getData());

                        }
                        else {
                            response.status(201).send(new Response('Helper Registered Successfully!').getData());
                        }
                    }
                });
            }
            catch{
                next(new SomethingWentWrongException());
            }
        }
    }
    private getCategories = async (categories: Types.ObjectId[]): Promise<string[]> => {
        let Categories: string[] = [];
        for (var i = 0; i < categories.length; i++) {
            await categoryModel.findById(categories[i], (err, category: ICategory) => {
                Categories.push(category.name);
            });
        }
        return Categories;
    }
    private getAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        let account: IHelper = await helperModel.findById(request.user._id, ' -password -_id -createdAt -updatedAt -__v');
        await this.getCategories(account.categoriesID).then((categories: string[]) => {
            account.categories = categories.slice();
        }).catch(err => {
            account.categories = [];
        });
        console.log(account.categories);
        let returnedAccount = account.toObject();
        console.log(returnedAccount);
        returnedAccount.picture = account.picture.toString('base64');
        returnedAccount.certificate = account.certificate.toString('base64');
        returnedAccount.frontID = account.frontID.toString('base64');
        returnedAccount.backID = account.backID.toString('base64');
        response.status(200).send(new Response(undefined, { returnedAccount }).getData());
    }
    private updateAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        let newData: updateHelperDTO = request.body;
        if (newData.picture) {
            newData.picture = Buffer.from(newData.picture, 'base64');
        }
        /// lazem ne3ml middleware le hewar al base64 da 3ashan keda msh haynf3
        let newUser = await helperModel.findByIdAndUpdate(request.user._id, { $set: newData });
        if (newUser) {
            response.status(200).send(new Response('Updated Successfuly!').getData());
        }
        else {
            next(new SomethingWentWrongException());
        }
    }
}

export default HelperController;