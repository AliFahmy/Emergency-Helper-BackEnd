import IOffer from './IOffer';
interface IFinishedState {
    paymentMethod:string;
    items:string;
    totalPrice:number;
    isPaid:boolean;
    isFinished:boolean;
    clientRate:number;
    helperRate:number;
    supportTickets:string[];
}

export default IFinishedState;