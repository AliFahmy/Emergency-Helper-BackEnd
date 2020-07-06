import { Document } from 'mongoose';
import IMessage from './IMessage';
interface IConversation extends Document {
  date: Date;
  requestID: string;
  _id: string;
  messages: IMessage[];
}
export default IConversation;
