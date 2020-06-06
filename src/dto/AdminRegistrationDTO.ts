import { IsString, IsEmail, IsNumber, ValidateNested, } from 'class-validator';

class AdminRegistrationDTO {
    @IsString()
    public name: string;

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    @IsString()
    public mobile: string;
}

export default AdminRegistrationDTO;