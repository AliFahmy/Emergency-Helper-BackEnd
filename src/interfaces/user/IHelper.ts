import IUser from './IUser';
import ILocation from './../ILocation';
interface IHelper extends IUser {
    bankAccount: string;
    isApproved:boolean;
    isActive:boolean;
    adminApproved:boolean;
    skills:string;
    location:ILocation;
    certificate:string;
    frontID:string;
    backID:string;
    category:string;
    role:string;
    currentOffer:string;
}
export default IHelper;