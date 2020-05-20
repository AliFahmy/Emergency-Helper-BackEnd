import { Document } from 'mongoose';
interface IFinishedRequest extends Document{
    date: Date;
    request:string;
    receipt:string;
}

export default IFinishedRequest;