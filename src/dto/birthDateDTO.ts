import { IsNumber } from 'class-validator';

class BirthDateDTO {
  @IsNumber()
  public day: number;
  @IsNumber()
  public month: number;
  @IsNumber()
  public year: number;
}

export default BirthDateDTO;