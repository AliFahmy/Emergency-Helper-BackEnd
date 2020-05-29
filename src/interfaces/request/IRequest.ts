import ILocation from './../ILocation';
import IOffer from './IOffer';
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
    offers:IOffer[]
    
}

export default IRequest;