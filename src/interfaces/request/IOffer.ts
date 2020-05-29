import IPrice from './IPrice';
interface IOffer {
    _id?:string;
    helperID:string;
    price:IPrice;
    description:string;
    isAccepted?:boolean
}

export default IOffer;