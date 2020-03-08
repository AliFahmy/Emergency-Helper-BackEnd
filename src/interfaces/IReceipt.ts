import { Document } from 'mongoose';

interface IReceipt extends Document{
    items:string;
    totalPrice:number;
}
export default IReceipt;