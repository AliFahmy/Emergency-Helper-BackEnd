import { IsString,ValidateNested,IsDate} from 'class-validator';

class UpdateClientDTO {
    
    @IsString()
    public firstName: string;
  
    @IsString()
    public lastName: string;
  
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