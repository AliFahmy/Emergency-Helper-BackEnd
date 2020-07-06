import IRate from './IRate';
interface IFinishedState {
  paymentMethod: string;
  items: string;
  totalPrice: number;
  isPaid: boolean;
  isFinished: boolean;
  clientRate: IRate;
  helperRate: IRate;
  supportTickets: string[];
}

export default IFinishedState;
