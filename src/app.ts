import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import IController from './interfaces/IController';
import * as cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/errorMiddleware';
import * as multer from 'multer';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from '../swagger.json';
import * as path from 'path';

class App {

  public app: express.Application;
  private PORT:any;


  constructor(controllers: IController[]) {
    this.app = express();
    this.PORT = process.env.PORT || 6000;
    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
    this.app.use("/", swaggerUi.serve,swaggerUi.setup(swaggerDocument));
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(multer({storage:multer.diskStorage({
      destination:  (req:express.Request, file:Express.Multer.File, cb) => {
          cb(null,path.join(__dirname, './uploads/'))
      },
      filename:  (req: express.Request, file: Express.Multer.File, cb: any) => {
          cb(null,`${new Date().toISOString().replace(/:/g, '-')}-${file.originalname}`)
      }
  }),fileFilter: (req:express.Request,file:Express.Multer.File,cb) => {
    if(file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)){
        cb(null,true);
    }
    else{
      return cb(new Error('This File Type Is Not Supported!'));
    }
}}).any());
  this.app.use(function (req, res, next) {
    if(req.files){
      for(var i=0;i<req.files.length;i++){
        req.body[req.files[i].fieldname] = req.files[i].path;
      }
    }
    next();
  })
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
export default App;