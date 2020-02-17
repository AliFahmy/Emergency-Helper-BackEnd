
import App from './app';
import "../bin/dev"
import {validateEnv} from './utils/validateEnv';
import AccountController from './controllers/accountController';


validateEnv();
const app = new App(
  [
    new AccountController(),
  ]
);
app.listen();
    