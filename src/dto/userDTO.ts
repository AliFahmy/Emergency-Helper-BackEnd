import { IsString,IsEmail,IsNumber,ValidateNested } from 'class-validator';
import BirthDateDTO from './birthDateDTO';

class CreateUserDTO {
  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsEmail()
  public email: string;

  @IsString()
  public password: string;

  @ValidateNested()
  public birthDate : BirthDateDTO;

  @IsString()
  public gender: string;

  @IsString()
  public mobile : string;

  @IsString()
  public nationality : string;

  @IsString()
  public picture :string
}

export default CreateUserDTO;