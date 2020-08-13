import { IsString } from 'class-validator';

class resetPasswordDTO {
  @IsString()
  public email: string;
}

export default resetPasswordDTO;
