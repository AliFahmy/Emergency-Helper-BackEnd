import * as mongoose from 'mongoose';
import User from './User';
import IClient from '../../interfaces/user/IClient';
import GeoSchema from './../GeoSchema';

const Client = User.discriminator('Client',new mongoose.Schema({
    savedAddresses:[
        {
            name:{
                type:String
            },
            addressName:{
                type:String,
                required:true
            },
            location:GeoSchema
        }
    ]
}));

const clientModel = mongoose.model<IClient>('Client');

export default clientModel;