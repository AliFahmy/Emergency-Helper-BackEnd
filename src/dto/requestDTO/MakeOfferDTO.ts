import { IsString, IsNumber, IsObject} from 'class-validator';
import IPrice from './../../interfaces/request/IPrice';
class MakeOfferDTO {
  @IsObject()
  public price: IPrice;
  @IsString()
  public requestID: string;
  @IsString()
  public description:string
}

export default MakeOfferDTO;