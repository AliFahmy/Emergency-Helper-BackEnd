import { IsString} from 'class-validator';

class PictureDTO {
  @IsString()
  public picture : string;
  
}

export default PictureDTO;