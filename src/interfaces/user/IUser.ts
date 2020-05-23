import { Document} from "mongoose";
import IRequest from '../request/IRequest'
interface IUser extends Document{
    _id: string;
    verificationToken:string;
    firstName:string;
    lastName:string;
    email: string;
    password: string;
    birthDate: Date;
    gender:string;
    mobile:string;
    profilePicture:Buffer;
    balance:number;
    role:string;
    isApproved:boolean;
    requests:string[]
}
export default IUser;