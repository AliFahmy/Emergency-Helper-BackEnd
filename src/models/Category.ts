import * as mongoose from 'mongoose'
import ICategory from '../interfaces/ICategory';
const baseOptions = {
    timestamps:true
  };

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    }
},baseOptions)


const categoryModel = mongoose.model<ICategory>('Category',categorySchema);

export default categoryModel;