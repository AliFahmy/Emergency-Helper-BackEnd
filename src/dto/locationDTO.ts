import { IsNumber } from 'class-validator';

class LocationDTO {
  @IsNumber()
  public locationX : number;
  @IsNumber()
  public locationY: number;

}

export default LocationDTO;