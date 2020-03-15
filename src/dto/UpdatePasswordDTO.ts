import {IsString} from 'class-validator'
class UpdatePasswordDTO {
    @IsString()
    public oldPassword:string;
    @IsString()
    public newPassword:string;
}
export default UpdatePasswordDTO;