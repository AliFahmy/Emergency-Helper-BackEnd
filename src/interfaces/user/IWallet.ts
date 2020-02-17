import { Document} from "mongoose";

interface IWallet extends Document{
    balance:number;
}
export default IWallet;