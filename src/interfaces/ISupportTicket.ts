import { Document } from 'mongoose';
interface ISupportTicket extends Document{
    description:string;
    date:Date;
    category:string;
    request:string;
    _id:string;
}
export default ISupportTicket;