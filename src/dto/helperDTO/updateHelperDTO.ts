import { IsString, IsBoolean, ValidateNested } from 'class-validator';
import LocationDTO from '../locationDTO';
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
    public bankAccount: string;

    @IsBoolean()
    public isActive: boolean;

    @ValidateNested()
    public location: LocationDTO;

    @IsString()
    public skills: string;
}

export default UpdateHelperDTO;