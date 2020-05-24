import { IsString,IsEmail,ValidateNested} from 'class-validator';

class HelperRegistrationDTO {
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

    @IsString()
    public category: string;

    @IsString()
    public skills:string;
}
export default HelperRegistrationDTO;
