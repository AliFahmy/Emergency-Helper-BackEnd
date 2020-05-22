import * as mongoose from 'mongoose'
import IAboutUs from './../interfaces/IAboutUs';

const baseOptions = {
    timestamps:true
  };

const aboutUsSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    }
},baseOptions)


const aboutUsModel = mongoose.model<IAboutUs>('aboutUs',aboutUsSchema);

export default aboutUsModel;