import { Document } from 'mongoose';
import IRequestDate from './date/IRequestDate';
interface ISupportTicket extends Document{
    description:string;
    title:string;
    date:IRequestDate;
}
export default ISupportTicket;