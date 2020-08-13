import { IsString } from 'class-validator';

class PushTokenDTO {
  @IsString()
  public token: string;
}

export default PushTokenDTO;
