import { IsString,ValidateNested,IsDate} from 'class-validator';
import NameDTO from '../nameDTO';

class UpdateClientDTO {
    
    @ValidateNested()
    public name: NameDTO;
  
    @IsString()
    public email :string;

    @IsString()
    public mobile:string;

    @IsString()
    public gender:string;

    @IsDate()
    public birthDate:Date;
    
}

export default UpdateClientDTO;