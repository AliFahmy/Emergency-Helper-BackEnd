import { IsString } from 'class-validator';

class NameDTO {
  @IsString()
  public firstName : string;
  @IsString()
  public lastName: string;

}

export default NameDTO;