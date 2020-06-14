import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt'
import IUser from '../../interfaces/user/IUser';
import TokenManager from '../../modules/tokenManager';

const baseOptions = {
  discriminatorKey: 'role',
  collection: 'User',
  timestamps: true
};

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
  },
  mobile: {
    type: String
  },
  balance: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  activeRequest: {
    ref: 'Request',
    type: mongoose.Types.ObjectId
  },
  profilePicture:{
        type:String,
        default:"https://emergencyhelper.s3.eu-west-3.amazonaws.com/profilePictureTemplate.png"
  },
  requests: [{
    ref: 'Request',
    type: mongoose.Types.ObjectId,
    unique:true
  }],
  supportTickets: [{
    ref: 'supportTickets',
    type: mongoose.Types.ObjectId,
  }]
}, baseOptions);

userSchema.pre<IUser>('save', async function(next){
  if(this.isNew){
    this.password = bcrypt.hashSync(this.password, 10);
    this.verificationToken = new TokenManager().getToken({ email: this.email })
    this.email = this.email.toLowerCase()
  }
  next();
});
// userSchema.pre<IUser>('remove', async function(next){
//   next();
// });

const userModel = mongoose.model<IUser>('User', userSchema);

export default userModel;