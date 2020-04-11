import * as mongoose from 'mongoose'
import IPaymentMethod from '../../interfaces/IPaymentMethod';

const baseOptions = {
    timestamps:true
  };

const paymentMethodSchema = new mongoose.Schema({
   name:{
       type:String,
       required:true
   }
},baseOptions)

const paymentMethodModel = mongoose.model<IPaymentMethod>('PaymentMethod',paymentMethodSchema);

export default paymentMethodModel;