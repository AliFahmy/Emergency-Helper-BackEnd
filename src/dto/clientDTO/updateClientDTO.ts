import { IsString} from 'class-validator';

class UpdateClientDTO {
    @IsString()
    public email :string;

    @IsString()
    public mobile:string;

    @IsString()
    public nationality:string;
    
    @IsString()
    public picture:any;
}

export default UpdateClientDTO;