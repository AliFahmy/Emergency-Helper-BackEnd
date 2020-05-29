import { Document } from 'mongoose';
import IPrice from './IPrice';
interface IAcceptedRequest extends Document{
    date?: Date;
    price:IPrice;
    request:string;
    helper:string;
}

export default IAcceptedRequest;