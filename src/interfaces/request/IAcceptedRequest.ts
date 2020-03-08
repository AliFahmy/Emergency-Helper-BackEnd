import IRequestDate from './../date/IRequestDate';
import { Document } from 'mongoose';
interface IAcceptedRequest extends Document{
    date: IRequestDate;
    price:Number;
}

export default IAcceptedRequest;