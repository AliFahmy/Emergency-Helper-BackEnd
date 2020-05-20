import { Document } from 'mongoose';

interface ISupportTicketCategory extends Document{
  name:string;
  _id:string;
}
export default ISupportTicketCategory;