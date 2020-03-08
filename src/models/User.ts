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
      required:true
    },
    month:{
      type:Number,
      required:true
    },
    year:{
      type:Number,
      required:true
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
      required:true
  },
  mobile:{
      type:String,
      required:true
  },
  nationality:{
      type:String,
      required:true
  },
  picture:{
      type:String,
      required:true
  }
},baseOptions);
 
const userModel = mongoose.model<IUser>('User', userSchema);
 
export default userModel;