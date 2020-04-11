import * as mongoose from 'mongoose';
import IAcceptedRequest from '../../interfaces/request/IAcceptedRequest';

const baseOptions = {
    timestamps:true
  };

const acceptedRequestSchema = new mongoose.Schema({
    arrivesAt:{
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
    price:{
        type:Number,
        required:true
    },
    request:{
        ref:'Request',
        type:mongoose.Schema.Types.ObjectId
    }
},baseOptions)

const acceptedRequestModel = mongoose.model<IAcceptedRequest>('AcceptedRequest',acceptedRequestSchema);

export default acceptedRequestModel;