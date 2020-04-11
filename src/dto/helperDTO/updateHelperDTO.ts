import { IsString, IsBoolean, ValidateNested} from 'class-validator';
import LocationDTO from '../locationDTO';
class UpdateHelperDTO {
    @IsString()
    public email :string;

    @IsString()
    public mobile:string;

    @IsString()
    public nationality:string;
    
    @IsString()
    public picture:any;

    @IsString()
    public bankAccount:string;
    
    @IsBoolean()
    public isActive:boolean;
    
    @ValidateNested()
    public location:LocationDTO;
    
    @IsString()
    public skills:string;
}

export default UpdateHelperDTO;