import * as mongoose from 'mongoose';
import IRequest from '../../interfaces/request/IRequest';

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
        default:false
    },
    location:{
        longitude:{
            type:Number,
            required:true
        },
        latitude:{
            type:Number,
            required:true
        }
    },
    date:{
        type:Date,
        required:true
    },
    client:{
        ref: 'Client',
        type: mongoose.Schema.Types.ObjectId,
        required:true
    },
    category:{
        ref: 'Category',
        type: String,
        required:true
    },
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