import { Document} from "mongoose";
 interface ILocation extends Document{
    locationX : string;
    locationY : string;
}
export default ILocation;