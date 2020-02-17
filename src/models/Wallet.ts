import * as mongoose from 'mongoose';
import IWallet from '../interfaces/user/IWallet';

const walletSchema = new mongoose.Schema({
    balance:{
        type:Number,
        required:true
    }
});

export default walletSchema;