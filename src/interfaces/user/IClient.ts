import IAddress from './IAddress';
import IUser from './IUser';
interface IClient extends IUser {
    savedAddresses: IAddress[]
}

export default IClient;
