import {Document} from 'mongoose'
interface IAdmin extends Document {
    _id:string;
    name:string;
    mobile:string;
    email:string;
    password:string;
}

export default IAdmin;
