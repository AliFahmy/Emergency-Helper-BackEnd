import * as mongoose from 'mongoose';
import User from './User';
import addressSchema from './Address';
import IClient from '../interfaces/user/IClient';
const Client = User.discriminator('Client',new mongoose.Schema({
    address:{
        type:addressSchema
    }
}));

const clientModel = mongoose.model<IClient>('Client');

export default clientModel;