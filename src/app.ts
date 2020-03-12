import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import IController from './interfaces/IController';
import * as cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/errorMiddleware';
import * as multer from 'multer';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerJSDoc from 'swagger-jsdoc'
import * as swaggerDocument from '../swagger.json';


class App {
  
  public app: express.Application;
  private PORT:any;


  constructor(controllers: IController[]) {
    this.app = express();
    this.app.use("/", swaggerUi.serve,swaggerUi.setup(swaggerDocument));
    this.PORT = process.env.PORT || 5000;
    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }
 
  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(multer({storage:multer.diskStorage({
      destination: function (req, file, cb) {
          cb(null, 'uploads/')
      },
      filename: function (req: any, file: Express.Multer.File, cb: any) {
          cb(null,new Date().toISOString + '-' + file.originalname)
      }
  }),fileFilter: (req:Express.Request,file:Express.Multer.File,cb) => {
    if(file.mimetype === 'image/jpg'|| file.mimetype === 'image/jpeg'){
        cb(null,true);
    }
    else{
        cb(null,false);
    }
}}).array('image'));
  
  this.app.use(cookieParser());
}


 private initializeErrorHandling(){
   this.app.use(errorMiddleware);
 }
 
  private initializeControllers(controllers:IController[]) {
    controllers.forEach((controller) => {
      this.app.use('/api', controller.router);
    });
  }
 
  private connectToDatabase(){
    const {
      MONGODB_URL
      } = process.env;
      mongoose
        .connect(MONGODB_URL.toString(),{ useNewUrlParser: true,useUnifiedTopology:true })
        .then((result)=>{
            console.log("CONNECTED TO DB")
        })
        .catch((err:Error)=>{
            console.log(err);
        })
    }
  public listen() {
    this.app.listen(this.PORT, () => {
      console.log(`App listening on the port ${this.PORT}`);
    });
  }
}
 
export default App