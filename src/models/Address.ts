import * as mongoose from 'mongoose';
import IAddress from 'interfaces/user/IAddress';

const addressSchema = new mongoose.Schema({
    addressName:{
        type:String,
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
    }
})

const addressModel = mongoose.model<IAddress>('ClientAddress',addressSchema);

export default addressModel;