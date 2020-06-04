import { IsString,IsNotEmptyObject } from 'class-validator';
import LocationDTO from './../locationDTO';


class AddAddressDTO {
  @IsString()
  public name: string;

  @IsString()
  public addressName: string;

  @IsNotEmptyObject()
  public location: LocationDTO;

}

export default AddAddressDTO;