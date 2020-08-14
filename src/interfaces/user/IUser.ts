import { Document } from 'mongoose';
import IUserRate from './IUserRate';

interface IUser extends Document {
  _id: string;
  verificationToken: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  password: string;
  birthDate: Date;
  gender: string;
  mobile: string;
  balance: number;
  role: string;
  isApproved: boolean;
  requests: string[];
  supportTickets: string[];
  activeRequest: string;
  conversation: string;
  expoToken: string;
  rate: IUserRate;
}
export default IUser;
