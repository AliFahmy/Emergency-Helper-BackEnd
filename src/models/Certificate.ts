import * as mongoose from 'mongoose'
import ICertificate from './../interfaces/ICertificate';

const baseOptions = {
    timestamps:true
  };

const certificateSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    url:{
        type:String,
        required:true
    }
},baseOptions)

const certificateModel = mongoose.model<ICertificate>('Certificate',certificateSchema);

export default certificateModel;