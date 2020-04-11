import * as mongoose from 'mongoose'
import IReceipt from '../../interfaces/IReceipt';

const baseOptions = {
    timestamps:true
  };

const receiptSchema = new mongoose.Schema({
    items:{
        type:String,
        required:true
    },
    totalPrice:{
        type:Number,
        required:true
    },
    paymentMethod:{
        ref:'PaymentMethod',
        type:mongoose.Schema.Types.ObjectId
    }
},baseOptions)

const receiptModel = mongoose.model<IReceipt>('Receipt',receiptSchema);

export default receiptModel;