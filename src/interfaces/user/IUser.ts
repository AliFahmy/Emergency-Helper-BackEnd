import { Document} from "mongoose";
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
}
export default IUser;