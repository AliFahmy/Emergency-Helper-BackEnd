import { IsString, IsNumber, IsMongoId } from 'class-validator';
class RateRequestDTO {
  @IsString()
  public feedback: string;

  @IsNumber()
  public rate: number;

  @IsMongoId()
  public requestID: string;
}

export default RateRequestDTO;
