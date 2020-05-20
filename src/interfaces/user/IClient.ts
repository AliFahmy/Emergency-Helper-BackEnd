import IAddress from './IAddress';
import IUser from './IUser';
interface IClient extends IUser {
    savedAddress: IAddress[]
}

export default IClient;
