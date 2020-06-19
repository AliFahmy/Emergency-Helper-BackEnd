import { IsString,IsObject, IsMongoId } from 'class-validator';
import IPrice from './../../interfaces/request/IPrice';
class MakeOfferDTO {
  @IsObject()
  public price: IPrice;
  @IsMongoId()
  public requestID: string;
  @IsString()
  public description:string
}

export default MakeOfferDTO;