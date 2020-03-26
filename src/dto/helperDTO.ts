import { IsString,IsEmail,ValidateNested,IsBase64,IsArray} from 'class-validator';
import NameDTO from './nameDTO';

class HelperDTO {
    @ValidateNested()
    public name: NameDTO;

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    @IsArray()
    public categories: string[];

    @IsString()
    public skills:string;

    @IsBase64()
    public frontID:string;

    @IsBase64()
    public backID:string;

    @IsBase64()
    public certificate:string;

    @IsBase64()
    public picture:string;
}
export default HelperDTO;
