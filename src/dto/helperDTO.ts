import { IsString,IsEmail,IsNumber,ValidateNested, IsBoolean } from 'class-validator';
import CreateUserDTO from './userDTO';
class HelperDTO extends CreateUserDTO {
    @IsString()
    public bankAccount: string;

    @IsString()
    public cv_url: string;
    
    @IsBoolean()
    public isApproved:boolean;

    @IsNumber()
    public nationalNumberId:number;

    @IsString()
    public nationalCardPhoto:string;
  
}
export default HelperDTO;