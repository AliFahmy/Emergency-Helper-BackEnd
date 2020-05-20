import { IsString,IsEmail,ValidateNested} from 'class-validator';
import NameDTO from '../nameDTO';

class HelperRegistrationDTO {
    @ValidateNested()
    public name: NameDTO;

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
