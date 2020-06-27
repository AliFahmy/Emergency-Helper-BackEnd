import ILocation from '../ILocation';
interface IAddress {
  _id?: string;
  addressName: string;
  name: string;
  location: ILocation;
}
export default IAddress;
