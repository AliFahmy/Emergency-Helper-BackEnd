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
        this.router.post(`${this.path}/Category`,authMiddleware,validationMiddleware(CategoryDTO),this.insertCategory);
    }
    private getAllCategories =  async (request:express.Request,response:express.Response,next:express.NextFunction) =>{
        await categoryModel.find({},'-_id -createdAt -updatedAt -__v',(err,categories)=>{
            if(err){
                response.status(400).send(err);
            }
            else{
                response.status(200).send(categories);
            }
        })
    }
    private insertCategory =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
            const categoryDTO:CategoryDTO = request.body;
            const category = await categoryModel.create(categoryDTO)
            if(category){
                response.status(201).send("Created Category");
            }
            else{
                response.status(400).send("Failed To Create Category");    
            }
    }

}

export default HelperController;