import IAddress from './IAddress';
import IUser from './IUser';
import IRequest from './../request/IRequest';
interface IClient extends IUser {
    savedAddress: IAddress[],
    requests: IRequest[]
}

export default IClient;
