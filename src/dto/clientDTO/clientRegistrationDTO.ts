import { IsString,IsEmail,IsNumber,ValidateNested, } from 'class-validator';
import NameDTO from '../nameDTO';

class ClientRegistrationDTO {
  @ValidateNested()
  public name: NameDTO;

  @IsEmail()
  public email: string;

  @IsString()
  public password: string;

  @IsString()
  public mobile : string;
}

export default ClientRegistrationDTO;