import IRequestDate from './../date/IRequestDate';
import ILocation from './../ILocation';
import { Document } from 'mongoose';
interface IRequest extends Document{
    description: string;
    isCanceled: boolean;
    date: IRequestDate;
    location:ILocation;
    categoryId:string;
    helperId:string;
    clientId:string;
}

export default IRequest;