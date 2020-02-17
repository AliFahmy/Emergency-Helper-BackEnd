import { Document} from "mongoose";
interface IAddress extends Document{
    addressName:string;
    location:{
        locationX:number;
        locationY:number;
    }
}
export default IAddress;