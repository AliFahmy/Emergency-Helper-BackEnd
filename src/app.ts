import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import IController from './interfaces/IController';
import * as cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/errorMiddleware';
class App {
  public app: express.Application;
 
  constructor(controllers: IController[]) {
    this.app = express();
    
    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }
 
  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
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
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }
}
 
export default App