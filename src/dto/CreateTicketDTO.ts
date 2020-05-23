import { IsString,IsEmail,IsNumber } from 'class-validator';

class CreateTicketDTO {
  @IsNumber()
  public userRole:number;
  
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

export default CreateTicketDTO;