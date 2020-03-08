import IRequestDate from './../date/IRequestDate';
import { Document } from 'mongoose';
interface IFinishedRequest extends Document{
    date: IRequestDate;
}

export default IFinishedRequest;