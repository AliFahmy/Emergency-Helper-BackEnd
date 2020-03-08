import * as mongoose from 'mongoose';
import IRequest from './../interfaces/request/IRequest';

const baseOptions = {
  timestamps:true
};

const requestSchema = new mongoose.Schema({
    description:{
        type:String,
        required:true
    },
    isCanceled:{
        type:Boolean,
        required:true
    },
    location:{
        locationX:{
            type:Number,
            required:true
        },
        locationY:{
            type:Number,
            required:true
        }
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
    client:{
        ref: 'Client',
        type: mongoose.Schema.Types.ObjectId,
    },
    category:[{
        ref: 'Category',
        type: mongoose.Schema.Types.ObjectId,
    }],
    helper:{
        ref:'Helper',
        type:mongoose.Schema.Types.ObjectId
    },
    supportTickets:[{
        ref:'SupportTicket',
        type:mongoose.Schema.Types.ObjectId
    }]

},baseOptions);
 
const requestModel = mongoose.model<IRequest>('Request', requestSchema);
 
export default requestModel;