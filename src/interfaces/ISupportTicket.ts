import { Document } from 'mongoose';
interface ISupportTicket extends Document{
    description:string;
    date:Date;
    category:string;
    request:string;
}
export default ISupportTicket;