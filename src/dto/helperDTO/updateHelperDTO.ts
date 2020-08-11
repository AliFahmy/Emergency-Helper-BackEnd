import { IsString, IsISO8601} from 'class-validator';
class UpdateHelperDTO {
    @IsString()
    public firstName: string;
    
    @IsString()
    public lastName: string;

    @IsString()
    public email: string;

    @IsString()
    public mobile: string;

    @IsString()
    public gender:string;

    public birthDate:Date;

    @IsString()
    public category: string;

    @IsString()
    public skills:string;
}

export default UpdateHelperDTO;