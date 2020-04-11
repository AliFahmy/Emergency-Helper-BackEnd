import * as mongoose from 'mongoose';
import IFinishedRequest from '../../interfaces/request/IFinishedRequest';

const baseOptions = {
    timestamps:true
  };

const finishedRequestSchema = new mongoose.Schema({
    finishDate:{
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
    request:{
        ref:'Request',
        type:mongoose.Schema.Types.ObjectId
    },
    receipt:{
        ref:'Receipt',
        type:mongoose.Schema.Types.ObjectId
    }
},baseOptions)

const finishedRequestModel = mongoose.model<IFinishedRequest>('FinishedRequest',finishedRequestSchema);

export default finishedRequestModel;