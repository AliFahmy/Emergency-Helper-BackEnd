import { IsString,IsEmail,ValidateNested,IsBase64,IsArray} from 'class-validator';
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

    @IsArray()
    public categories: string[];

    @IsString()
    public skills:string;
}
export default HelperRegistrationDTO;
