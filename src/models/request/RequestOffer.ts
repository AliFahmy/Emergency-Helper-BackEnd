import * as mongoose from 'mongoose';
import IRequestOffer from './../../interfaces/request/IRequestOffer';

const baseOptions = {
    timestamps: true
};

const RequestOffer = new mongoose.Schema({
    helperID:{
        ref:'Helper',
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    requestID:{
        ref:'Request',
        type:mongoose.Schema.Types.ObjectId
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
    description:{
        type:String,
        required:true
    },
    isAccepted:{
        type:Boolean,
        default:false
    }
}, baseOptions)

const requestOfferModel = mongoose.model<IRequestOffer>('RequestOffer', RequestOffer);

export default requestOfferModel;