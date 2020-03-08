import { IsString } from 'class-validator';

class NameDTO {
  @IsString()
  public firstName : number;
  @IsString()
  public lastName: number;

}

export default NameDTO;