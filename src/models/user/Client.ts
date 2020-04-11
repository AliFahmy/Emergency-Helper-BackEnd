import * as mongoose from 'mongoose';
import User from './User';
import IClient from '../../interfaces/user/IClient';

const Client = User.discriminator('Client',new mongoose.Schema({
    savedAddresses:[
        {
            ref: 'Addresses',
            type: mongoose.Schema.Types.ObjectId,
        }
    ]
}));

const clientModel = mongoose.model<IClient>('Client');

export default clientModel;