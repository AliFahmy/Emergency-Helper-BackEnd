import { Document} from "mongoose";
import ILocation from '../ILocation';
interface IAddress extends Document{
    addressName:string;
    location:ILocation;
}
export default IAddress;