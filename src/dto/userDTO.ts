import { IsString,IsEmail,IsNumber,ValidateNested, } from 'class-validator';
import BirthDateDTO from './birthDateDTO';
import NameDTO from './nameDTO';

class CreateUserDTO {
  @IsNumber()
  public userRole:number;
  
  @ValidateNested()
  public name: NameDTO;

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
  public picture :string;
  
}

export default CreateUserDTO;