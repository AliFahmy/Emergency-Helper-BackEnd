import IAddress from './IAddress';
import IUser from './IUser';
import { Document } from 'mongoose';
interface IClient extends IUser {
    savedAddress: IAddress
}

export default IClient;
