import { IsString,IsEmail,IsNumber,ValidateNested,IsArray } from 'class-validator';
import NameDTO from './nameDTO';

class HelperDTO {
    @ValidateNested()
    public name: NameDTO;

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    @IsString()
    public mobile : string;

    @IsArray()
    public categories:string[];

    @IsArray()
    public skills:string[];

    @IsString()
    public frontID:string;

    @IsString()
    public backID:string;

    @IsString()
    public certificate:string;

    @IsString()
    public picture:string;
}
export default HelperDTO;
