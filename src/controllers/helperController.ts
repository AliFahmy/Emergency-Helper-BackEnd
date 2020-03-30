import * as express from 'express';
////////////////////////////////////////////////////
import IController from '../interfaces/IController';
import IRequestWithUser from 'interfaces/httpRequest/IRequestWithUser';
////////////////////////////////////////////////////
import authMiddleware from '../middlewares/auth';
import validationMiddleware from '../middlewares/validation';
///////////////////////////////////////////////////
import categoryModel from '../models/Category';
////////////////////////////////////////////////////
import CategoryDTO from '../dto/categoryDTO';
////////////////////////////////////////////////////
import HelperCategoryAlreadyExistsException from '../exceptions/HelperCategoryAlreadyExistsException';
import SomethingWentWrongException from '../exceptions/SomethingWentWrongException';
import ICategory from './../interfaces/ICategory';
class HelperController implements IController {
    public path:string;
    public router:express.IRouter;
    
    constructor(){
        this.path = '/Helper';
        this.router = express.Router();
        this.initializeRoutes();
    }
    private initializeRoutes(){
        this.router.get(`${this.path}/AllCategories`,this.getAllCategories);
        ////////////////////////////////////////////////////////////////////
        this.router.post(`${this.path}/Category`,validationMiddleware(CategoryDTO),this.insertCategory);
    }
    private getAllCategories =  async (request:express.Request,response:express.Response,next:express.NextFunction) =>{
        await categoryModel.find({},'-_id -createdAt -updatedAt -__v',(err,categories)=>{
            if(err){
                next(new SomethingWentWrongException());
            }
            else{
                response.status(200).send(categories);
            }
        })
    }
    private insertCategory =  async (request:express.Request,response:express.Response,next:express.NextFunction) =>{
            const categoryDTO:CategoryDTO = request.body;
            if(await categoryModel.findOne({name:categoryDTO.name}))
            {
                next(new HelperCategoryAlreadyExistsException());
            }
            else{
                await categoryModel.create(categoryDTO,(err:any,category:ICategory)=>{
                    if(err){
                        next(new SomethingWentWrongException());
                    }
                    else{
                        response.status(201).send("Created Category Successfully");
                    }   
                })
            }
    }

}

export default HelperController;