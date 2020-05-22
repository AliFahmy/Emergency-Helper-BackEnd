import * as mongoose from 'mongoose'
import ISupportTicketCategory from './../../interfaces/ISupportTicketCategory';
const baseOptions = {
    timestamps:true
  };

const supportTicketCategorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    }
},baseOptions)


const categoryModel = mongoose.model<ISupportTicketCategory>('Category',supportTicketCategorySchema);

export default categoryModel;