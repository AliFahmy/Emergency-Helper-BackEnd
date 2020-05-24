import ILocation from './../ILocation';
import { Document } from 'mongoose';
interface IRequest extends Document{
    _id:string;
    description: string;
    isCanceled: boolean;
    date: Date;
    location:ILocation;
    category:string;
    client:string;
    acceptedRequestID:string;
    finishedRequestID:string;
    
}

export default IRequest;