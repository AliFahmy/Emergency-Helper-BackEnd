
import App from './app';
import "../bin/dev"
import {validateEnv} from './utils/validateEnv';
import AccountController from './controllers/accountController';
import AdminController from './controllers/adminController';
import HelperController from './controllers/helperController';
validateEnv();
const app = new App(
  [
    new AccountController(),
    new AdminController(),
    new HelperController()
  ]
  );
app.listen();
    