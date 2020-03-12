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

  @IsString()
  public mobile : string;
  
}

export default CreateUserDTO;