import { IsString, IsNumber } from 'class-validator';
class RateRequestDTO {
  @IsString()
  public feedback: string;

  @IsNumber()
  public rate: number;
}

export default RateRequestDTO;
