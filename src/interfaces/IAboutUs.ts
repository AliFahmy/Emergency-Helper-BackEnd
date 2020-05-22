import { Document } from 'mongoose';

interface IAboutUs extends Document{
  name:string;
  description:string;
  _id:string;
}
export default IAboutUs;