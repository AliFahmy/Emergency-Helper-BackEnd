
import App from './app';
import "../bin/dev"
import {validateEnv} from './utils/validateEnv';
import AccountController from './controllers/accountController';
import AdminController from './controllers/adminController';
import HelperController from './controllers/helperController';
import ClientController from './controllers/clientController';
import GeneralController from './controllers/generalController';

validateEnv();


const app = new App(
  [
    new GeneralController(),
    new ClientController(),
    new AccountController(),
    new HelperController(),
    new AdminController()
  ]
  );
  
app.listen();
    