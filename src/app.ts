import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import IController from './interfaces/IController';
import * as cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/errorMiddleware';
import * as multer from 'multer';
class App {
  public app: express.Application;
  private PORT;
  constructor(controllers: IController[]) {
    this.app = express();
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
      this.app.use('/', controller.router);
    });
  }
 
  private connectToDatabase(){
    const {
        MONGO_USER,
        MONGO_PASSWORD,
        MONGO_PATH,
      } = process.env;
      mongoose
        .connect(`mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}`,{ useNewUrlParser: true })
        .then((result)=>{
            console.log(result)
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