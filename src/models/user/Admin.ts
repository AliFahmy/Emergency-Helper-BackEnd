import * as mongoose from 'mongoose';
import User from './User';
import IAdmin from '../../interfaces/user/IAdmin'
const Admin = User.discriminator('Admin',new mongoose.Schema());

const adminModel = mongoose.model<IAdmin>('Admin');

export default adminModel;