import { IsString,ValidateNested } from 'class-validator';

class UpdateAccountDTO {

    @IsString()
    public email :string;

    @IsString()
    public mobile:string;

    @IsString()
    public nationality:string;
}

export default UpdateAccountDTO;