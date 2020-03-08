import { Document } from 'mongoose';

interface ICertificate extends Document{
  name:string;
  url:string;
}
export default ICertificate;