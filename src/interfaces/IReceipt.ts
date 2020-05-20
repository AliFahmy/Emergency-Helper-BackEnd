import { Document } from 'mongoose';

interface IReceipt extends Document{
    items:string;
    totalPrice:number;
    paymentMethod:string;
    requestID:string;
}
export default IReceipt;