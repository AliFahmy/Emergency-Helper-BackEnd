import IAddress from './IAddress';
import IUser from './IUser';
import IRequest from './../request/IRequest';
import ILocation from './../ILocation';
interface IHelper extends IUser {
    bankAccount: string;
    cv_url: string;
    isApproved:boolean;
    nationalNumberId:number;
    nationalCardPhoto:{
        front:string;
        back:string;
    };
    passportPhoto:string;
    isActive:boolean;
    location:ILocation;
}

export default IHelper;
