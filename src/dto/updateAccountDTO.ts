import { IsString,IsBase64,IsOptional} from 'class-validator';

class UpdateAccountDTO {
    @IsString()
    public email :string;

    @IsString()
    public mobile:string;

    @IsString()
    public nationality:string;
    
    @IsBase64()
    public picture:string;
}

export default UpdateAccountDTO;