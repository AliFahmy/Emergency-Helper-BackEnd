import { Document } from "mongoose";
import { stringList } from "aws-sdk/clients/datapipeline";

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
}
export default IUser;