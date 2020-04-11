import IUser from './IUser';
import ILocation from './../ILocation';
import { Types } from 'mongoose';
interface IHelper extends IUser {
    bankAccount: string;
    isApproved:boolean;
    isActive:boolean;
    location:ILocation;
    certificate:Buffer;
    frontID:Buffer;
    backID:Buffer;
    categories:string[];
    categoriesID:Types.ObjectId[];
}
export default IHelper;