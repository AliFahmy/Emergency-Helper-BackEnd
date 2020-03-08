import * as mongoose from 'mongoose';
import User from './User';
import IHelper from './../interfaces/user/IHelper';

const Helper = User.discriminator('Helper',new mongoose.Schema({
    cv_url:{
        type:String,
        required:true
    },
    bankAccount:{
        type:String,
        required:true
    },
    isApproved:{
        type:Boolean,
        required:true
    },
    nationalNumberId:{
        type:Number
    },
    nationalCardPhoto:{
        front:{
            type:String
        },
        back:{
            type:String
        }
    },
    passportPhoto:{
        type:String
    },
    isActive:{
        type:Boolean,
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
}));

const helperModel = mongoose.model<IHelper>('Helper');

export default helperModel;