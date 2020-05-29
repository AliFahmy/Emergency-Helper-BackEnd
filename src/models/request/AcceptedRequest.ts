import * as mongoose from 'mongoose';
import IAcceptedRequest from '../../interfaces/request/IAcceptedRequest';

const baseOptions = {
    timestamps:true
  };

const acceptedRequestSchema = new mongoose.Schema({
    arrivesAt:{
        type:Date
    },
    price:{
       from:{
        type:Number,
        required:true
       }, 
       to:{
        type:Number,
        required:true
       } 
    },
    request:{
        ref:'Request',
        type:mongoose.Schema.Types.ObjectId
    },
    helper:{
        ref:'Helper',
        type:mongoose.Schema.Types.ObjectId
    },
},baseOptions)

const acceptedRequestModel = mongoose.model<IAcceptedRequest>('AcceptedRequest',acceptedRequestSchema);

export default acceptedRequestModel;