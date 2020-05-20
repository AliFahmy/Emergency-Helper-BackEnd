import * as mongoose from 'mongoose';
import ISupportTicket from '../../interfaces/ISupportTicket';

const baseOptions = {
    timestamps:true
  };

const supportTicketSchema = new mongoose.Schema({
    description:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    category:{
        ref: 'SupportTicketCategory',
        type: String
    },
    request:{
        ref: 'Request',
        type: mongoose.Schema.Types.ObjectId    
    }
},baseOptions)

const supportTicketModel = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
 
export default supportTicketModel;