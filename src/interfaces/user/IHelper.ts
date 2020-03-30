import IUser from './IUser';
import ILocation from './../ILocation';
interface IHelper extends IUser {
    bankAccount: string;
    isApproved:boolean;
    isActive:boolean;
    location:ILocation;
    categories:string[];
}
export default IHelper;