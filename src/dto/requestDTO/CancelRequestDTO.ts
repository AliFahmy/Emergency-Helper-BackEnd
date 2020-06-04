import { IsString} from 'class-validator';

class CancelRequestDTO {
  @IsString()
  public message:string;
}

export default CancelRequestDTO;