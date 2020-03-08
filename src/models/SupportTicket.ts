import * as mongoose from 'mongoose';
import ISupportTicket from './../interfaces/ISupportTicket';

const baseOptions = {
    timestamps:true
  };

const supportTicketSchema = new mongoose.Schema({
    description:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    date:{
        year:{
            type:Number,
            required:true
        },
        month:{
            type:Number,
            required:true
        },
        day:{
            type:Number,
            required:true
        },
        hours:{
            type:Number,
            required:true
        },
        minutes:{
            type:Number,
            required:true
        }
    },
    user:{
        ref: 'User',
        type:mongoose.Schema.Types.ObjectId
    },
    request:{
        ref: 'Client',
        type: mongoose.Schema.Types.ObjectId,
    },
    category:{
        ref: 'SupportTicketCategory',
        type: mongoose.Schema.Types.ObjectId
    }
},baseOptions)

const supportTicketModel = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
 
export default supportTicketModel;