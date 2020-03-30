import * as mongoose from 'mongoose';
import IUser from '../interfaces/user/IUser';


const baseOptions = {
  discriminatorKey: 'role',
  collection:'User',
  timestamps:true
};

const userSchema = new mongoose.Schema({
  name:{
      firstName:{
        type: String,
        required: true
      },
      lastName:{
          type: String,
          required:true
      }
  },
  birthDate:{
    day:{
      type:Number,
    },
    month:{
      type:Number,
    },
    year:{
      type:Number,
    }
  },
  email:{
      type: String,
      required: true
  },
  password: {
    type:String,
    required:true
  },
  gender:{
      type:String,
  },
  mobile:{
      type:String
  },
  nationality:{
      type:String,
  },
  picture:{
      type:Buffer,
  },
  balance:{
    type:Number
  },
  isApproved:{
    type:Boolean,
    default:false
}
},baseOptions);
 
const userModel = mongoose.model<IUser>('User', userSchema);
 
export default userModel;