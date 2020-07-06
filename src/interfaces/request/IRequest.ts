import ILocation from './../ILocation';
import ISupportTicket from './../ISupportTicket';
import IAcceptedState from './IAcceptedState';
import IFinishedState from './IFinishedState';
import ICanceledState from './ICanceledState';
import { Document } from 'mongoose';
interface IRequest extends Document {
  _id: string;
  clientName: string;
  description: string;
  canceledState: ICanceledState;
  date: Date;
  location: ILocation;
  radius: number;
  category: string;
  client: string;
  supportTickets: ISupportTicket[];
  acceptedState: IAcceptedState;
  finishedState: IFinishedState;
  offers: string[];
  conversation: string;
}

export default IRequest;
