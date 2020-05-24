import { Document } from 'mongoose';
interface IFinishedRequest extends Document{
    date: Date;
    request:string;
    receipt:string;
    helper:string;
}

export default IFinishedRequest;