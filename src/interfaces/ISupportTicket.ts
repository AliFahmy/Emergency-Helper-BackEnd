import { Document } from 'mongoose';
import IMessage from './IMessage'
interface ISupportTicket extends Document {
    description: string;
    date: Date;
    category: string;
    request: string;
    _id: string;
    messages: IMessage[];
    closed: boolean;
}
export default ISupportTicket;