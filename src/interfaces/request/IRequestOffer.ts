import IPrice from './IPrice';
import { Document } from 'mongoose';
interface IRequestOffer extends Document {
  _id: string;
  helperID: string;
  price: IPrice;
  description: string;
  isAccepted: boolean;
  requestID: string;
  createdAt?: Date;
}

export default IRequestOffer;
