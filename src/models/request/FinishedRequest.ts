import * as mongoose from 'mongoose';
import IFinishedRequest from '../../interfaces/request/IFinishedRequest';

const baseOptions = {
    timestamps:true
  };

const finishedRequestSchema = new mongoose.Schema({
    finishDate:{
        type:Date,
        required:true
    },
    request:{
        ref:'Request',
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    receipt:{
        ref:'Receipt',
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    helper:{
        ref:'Helper',
        type:mongoose.Schema.Types.ObjectId
    },
},baseOptions)

const finishedRequestModel = mongoose.model<IFinishedRequest>('FinishedRequest',finishedRequestSchema);

export default finishedRequestModel;