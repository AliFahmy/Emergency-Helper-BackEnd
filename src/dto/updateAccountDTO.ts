import { IsString,IsBase64,IsOptional} from 'class-validator';

class UpdateAccountDTO {
    @IsOptional()
    @IsString()
    public email :string;

    @IsOptional()
    @IsString()
    public mobile:string;

    @IsOptional()
    @IsString()
    public nationality:string;
}

export default UpdateAccountDTO;