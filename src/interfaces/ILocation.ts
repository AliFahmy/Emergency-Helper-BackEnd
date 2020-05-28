import { Document} from "mongoose";
 interface ILocation extends Document{
    longitude : number;
    latitude : number;
}
export default ILocation;