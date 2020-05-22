import * as mongoose from 'mongoose';
import User from './User';
import IClient from '../../interfaces/user/IClient';

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
            location:{
                longitude:{
                    type:Number,
                    required:true
                },
                altitude:{
                    type:Number,
                    required:true
                }
            }
        }
    ],
    profilePicture:{
        type:String,
        default:"https://emergencyhelper.s3.eu-west-3.amazonaws.com/profilePictureTemplate.png"
    }
}));

const clientModel = mongoose.model<IClient>('Client');

export default clientModel;