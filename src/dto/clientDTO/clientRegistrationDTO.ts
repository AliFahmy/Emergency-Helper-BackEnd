import { IsString,IsEmail,IsNumber,ValidateNested, } from 'class-validator';

class ClientRegistrationDTO {
  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsEmail()
  public email: string;

  @IsString()
  public password: string;

  @IsString()
  public mobile : string;
}

export default ClientRegistrationDTO;