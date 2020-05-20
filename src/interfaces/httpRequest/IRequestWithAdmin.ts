import { Request } from 'express';
import IAdmin from '../user/IAdmin';
 
interface IRequestWithAdmin extends Request {
  user: IAdmin;
}
 
export default IRequestWithAdmin;