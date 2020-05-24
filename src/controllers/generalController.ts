import * as express from 'express';
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
/////////////////////////////////////////
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
////////////////////////////////////////
import Response from '../modules/Response';
import aboutUsModel from './../models/AboutUs';
import IAboutUs from './../interfaces/IAboutUs';
import AboutUsSectionDTO from './../dto/AboutUsSectionDTO';
class GeneralController implements IController {
    public path: string;
    public router: express.IRouter;
    constructor() {
        this.path = '/General';
        this.router = express.Router();
        this.initializeRoutes();
    }
    private initializeRoutes() {
       this.router.post(`${this.path}/AboutUs`,authMiddleware,validationMiddleware(AboutUsSectionDTO), this.addAboutUsSection);
       this.router.get(`${this.path}/AboutUs`,authMiddleware,this.getAboutUs);
    }
    private getAboutUs = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        await aboutUsModel.find({},'-_id -createdAt -updatedAt -__v')
        .then((sections:IAboutUs[])=>{
            response.status(200).send(new Response(undefined, {sections }).getData());
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err));
        })
    }
    private addAboutUsSection = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const section:AboutUsSectionDTO = request.body;
        await aboutUsModel.create(section)
        .then((section:IAboutUs)=>{
            if(section){
                response.status(201).send(new Response("Section Created Successfully",undefined).getData());
            }
            else{
                next(new SomethingWentWrongException())
            }
        })
        .catch(err=>{
            next(new SomethingWentWrongException(err));
        })
    }
}
export default GeneralController;
