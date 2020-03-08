import { Request } from 'express';
import IUser from '../user/IUser';
 
interface IRequestWithUser extends Request {
  user: IUser;
}
 
export default IRequestWithUser;