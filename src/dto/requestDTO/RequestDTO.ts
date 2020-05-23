import { IsString,ValidateNested} from 'class-validator';
import LocationDTO from '../locationDTO';
class RequestDTO {
  @IsString()
  public description: string;

  @ValidateNested()
  public location:LocationDTO;

  @IsString()
  public category: string;
}

export default RequestDTO;