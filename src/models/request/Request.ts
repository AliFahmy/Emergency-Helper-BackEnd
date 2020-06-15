import * as mongoose from 'mongoose';
import IRequest from '../../interfaces/request/IRequest';
import GeoSchema from './../GeoSchema';

const baseOptions = {
  timestamps:true
};

const requestSchema = new mongoose.Schema({
    description:{
        type:String,
        required:true
    },
    canceledState:{
        isCanceled:{
            type:Boolean,
            default:false
        },
        canceledUser:{
            ref:'User',
            type:mongoose.Schema.Types.ObjectId
        },
        message:{
            type:String
        }
    },
    location:GeoSchema,
    radius:{
        type:Number,
        default:5
    },
    date:{
        type:Date,
        required:true
    },
    offers:[
        {
            ref:'RequestOffer',
            type:mongoose.Schema.Types.ObjectId
        }
    ],
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
    acceptedState:{
        acceptedOffer:{
                ref:'RequestOffer',
                type:mongoose.Schema.Types.ObjectId
        },
        helperArrivalDate:{
            type:Date
        }
    },
    finishedState:{
        isFinished:{
            type:Boolean,
            default:false
        },
        paymentMethod:{
            ref:"PaymentMethod",
            type:mongoose.Schema.Types.ObjectId
        },
        items:[{
            item:{
                type:String
            },
            price:{
                type:Number
            }
        }],
        totalPrice:{
            type:Number
        },
        isPaid:{
            type:Boolean,
            default:false
        },
        clientRate:{
            type:Number
        },
        helperRate:{
            type:Number
        }
    },
    supportTickets:[{
        ref:'SupportTicket',
        type:mongoose.Schema.Types.ObjectId
    }]
},baseOptions);
 


const requestModel = mongoose.model<IRequest>('Request', requestSchema);
 
export default requestModel;