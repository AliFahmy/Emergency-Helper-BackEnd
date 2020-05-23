import { IsNumber } from 'class-validator';

class LocationDTO {
  @IsNumber()
  public longitude  : number;
  @IsNumber()
  public latitude: number;

}

export default LocationDTO;