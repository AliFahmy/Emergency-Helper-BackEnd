import { Document } from 'mongoose';

interface IPaymentMethod extends Document{
  name:string;
}
export default IPaymentMethod;