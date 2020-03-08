import { Document} from "mongoose";
interface IUser extends Document{
    _id: string;
    name:{
        firstName:string;
        lastName:string;
    }
  email: string;
  password: string;
  birthDate: {
    day:number,
    month:number,
    year:number
  };
  gender:string;
  mobile:string;
  nationality:string;
  picture:string;
  balance:number;
}
export default IUser;