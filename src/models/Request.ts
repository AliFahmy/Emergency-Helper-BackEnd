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
        type:Date,
        required:true
    },
    client:{
        ref: 'Client',
        type: mongoose.Schema.Types.ObjectId,
        required:true
    },
    category:[{
        ref: 'Category',
        type: mongoose.Schema.Types.ObjectId,
        required:true
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