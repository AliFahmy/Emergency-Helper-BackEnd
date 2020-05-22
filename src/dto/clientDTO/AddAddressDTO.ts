import { IsString,IsNotEmptyObject } from 'class-validator';
import ILocation from './../../interfaces/ILocation';


class AddAddressDTO {
  @IsString()
  public name: string;

  @IsString()
  public addressName: string;

  @IsNotEmptyObject()
  public location: ILocation;

}

export default AddAddressDTO;