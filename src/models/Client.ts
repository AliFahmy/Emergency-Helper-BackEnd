import * as mongoose from 'mongoose';
import User from './User';
import IClient from '../interfaces/user/IClient';

const Client = User.discriminator('Client',new mongoose.Schema());

const clientModel = mongoose.model<IClient>('Client');

export default clientModel;