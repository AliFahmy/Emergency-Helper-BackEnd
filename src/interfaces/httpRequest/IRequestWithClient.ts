import { Request } from 'express';
import IClient from './../user/IClient';
 
interface IRequestWithClient extends Request {
  user: IClient;
}
 
export default IRequestWithClient;