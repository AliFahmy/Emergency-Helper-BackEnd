import { Document } from 'mongoose';
interface IAcceptedRequest extends Document{
    date: Date;
    price:Number;
    request:string;
}

export default IAcceptedRequest;