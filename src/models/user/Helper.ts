import * as mongoose from 'mongoose';
import User from './User';
import IHelper from '../../interfaces/user/IHelper';

const Helper = User.discriminator('Helper',new mongoose.Schema({
    certificate:{
        type:String,
        required:true
    },
    bankAccount:{
        type:String
    },
    frontID:{
        type:String,
        required:true
    },
    backID:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        default:false
    },
    location:{
        locationX:{
            type:Number
        },
        locationY:{
            type:Number
        }
    },
    skills:{
        type:String
    },
    adminApproved:{
        type:Boolean,
        default:false
    },
    categoriesID:[{
        ref: 'Category',
        type: mongoose.Schema.Types.ObjectId,
    }]
}));

const helperModel = mongoose.model<IHelper>('Helper');

export default helperModel;
