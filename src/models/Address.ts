import * as mongoose from 'mongoose';
import IAddress from 'interfaces/user/IAddress';

const addressSchema = new mongoose.Schema({
    name:{
        type:String
    },
    addressName:{
        type:String,
        required:true
    },
    location:{
        longitude:{
            type:Number,
            required:true
        },
        altitude:{
            type:Number,
            required:true
        }
    }
})

const addressModel = mongoose.model<IAddress>('ClientAddress',addressSchema);

export default addressModel;