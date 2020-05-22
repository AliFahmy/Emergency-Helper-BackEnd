import * as mongoose from 'mongoose';
import User from './User';
import IHelper from '../../interfaces/user/IHelper';

const Helper = User.discriminator('Helper',new mongoose.Schema({
    certificate:[{
        type:String,
        required:true
    }],
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
        longitude:{
            type:Number
        },
        altitude:{
            type:Number
        }
    },
    skills:{
        type:String,
        required:true
    },
    adminApproved:{
        type:Boolean,
        default:false
    },
    category:{
        ref: 'Category',
        type: String,
    }
}));

const helperModel = mongoose.model<IHelper>('Helper');

export default helperModel;
