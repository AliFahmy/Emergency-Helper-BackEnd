import { Document } from 'mongoose';

interface ICategory extends Document{
  name:string;
  _id:string;
}
export default ICategory;