import { Document} from "mongoose";
 interface ILocation extends Document{
    longitude : number;
    altitude : number;
}
export default ILocation;