import * as mongoose from 'mongoose';
import IAdmin from '../../interfaces/user/IAdmin';
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
  },
});

const adminModel = mongoose.model<IAdmin>('Admin', adminSchema);

export default adminModel;
