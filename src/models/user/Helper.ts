import * as mongoose from 'mongoose';
import User from './User';
import IHelper from '../../interfaces/user/IHelper';

const Helper = User.discriminator('Helper',new mongoose.Schema({
    certificate:{
        type:Buffer,
        required:true
    },
    bankAccount:{
        type:String
    },
    frontID:{
        type:Buffer,
        required:true
    },
    backID:{
        type:Buffer,
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
