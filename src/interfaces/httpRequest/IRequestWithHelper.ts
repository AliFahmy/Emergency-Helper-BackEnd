import { Request } from 'express';
import IHelper from './../user/IHelper';
 
interface IRequestWithHelper extends Request {
  user: IHelper;
}
 
export default IRequestWithHelper;