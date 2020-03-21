import * as express from 'express';
////////////////////////////////////////////////////
import IController from '../interfaces/IController';
import IRequestWithUser from 'interfaces/httpRequest/IRequestWithUser';
////////////////////////////////////////////////////
import authMiddleware from '../middlewares/auth';
import adminMiddleware from '../middlewares/adminMiddleware';
///////////////////////////////////////////////////
import adminModel from './../models/Admin';
import helperModel from '../models/Helper';
import clientModel from '../models/Client';
import userModel from '../models/User';

class AdminController implements IController {
    public path:string;
    public router:express.IRouter;
    
    constructor(){
        this.path = '/Admin';
        this.router = express.Router();
        this.router.use(authMiddleware);
        this.router.use(adminMiddleware)
        this.initializeRoutes();
    }
    private initializeRoutes(){
        this.router.get(`${this.path}/GetPendingHelpers`,this.getPendingHelpers)
        this.router.get(`${this.path}/GetAllHelpers`,this.getAllHelpers)
        this.router.get(`${this.path}/GetAllClients`,this.getAllClients)
        this.router.get(`${this.path}/GetPhoto`,this.getPhoto)
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.post(`${this.path}/ApproveHelper`,this.approveHelper);
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.delete(`${this.path}/DeleteUser`,this.deleteUser)
    }
    private getPhoto =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        const path = request.query.path;
        response.sendFile(path, (err) => {
            if (err) {
                next(err);
            }
            else {
              console.log("sent");
            }
          });
    }
    private getPendingHelpers =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        await helperModel.find({isApproved:false},'-password -createdAt -updatedAt -__v' ,(err,helpers)=>{
            if(err){
                response.status(400).send(err);
            }
            else{
                response.status(200).send(helpers);
            }
        })
    }
    private deleteUser =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        await userModel.deleteOne({_id:request.query.id},(err)=>{
            if(err){
                next(err)
            }
            else{
                response.status(200).send("User Deleted Successfully");
            }
        })
    }
    private getAllClients =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        await clientModel.find({},'-password -createdAt -updatedAt -__v' ,(err,clients)=>{
            if(err){
                response.status(400).send(err);
            }
            else{
                response.status(200).send(clients);
            }
        })
    }
    private getAllHelpers =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
        await helperModel.find({},'-password -createdAt -updatedAt -__v' ,(err,helpers)=>{
            if(err){
                response.status(400).send(err);
            }
            else{
                response.status(200).send(helpers);
            }
        })
    }
    private approveHelper =  async (request:IRequestWithUser,response:express.Response,next:express.NextFunction) =>{
      const helperID = request.body.id;
      const helper = await helperModel.findById(helperID);
      if(helper){
          helper.isApproved = true;
          await helper.save((err)=>{
            if(err){
                next(err);
            }  
            else{
                response.status(200).send("Helper Approved");
            }

          });
      }
      else{
        response.status(400).send("Failed To Approve Helper");    
      }
    }
}

export default AdminController;