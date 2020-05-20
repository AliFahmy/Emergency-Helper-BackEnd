import { Document } from 'mongoose';

interface IPaymentMethod extends Document{
  name:string;
  _id:string;
}
export default IPaymentMethod;