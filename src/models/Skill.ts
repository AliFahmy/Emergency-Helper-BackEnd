import * as mongoose from 'mongoose'
import ISkill from './../interfaces/ISkill';

const baseOptions = {
    timestamps:true
  };

const skillSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    }
},baseOptions)

const skillModel = mongoose.model<ISkill>('Skill',skillSchema);

export default skillModel;