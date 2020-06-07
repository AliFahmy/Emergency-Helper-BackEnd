import {IsNumber,IsLongitude, IsLatitude, Max, Min } from 'class-validator';

class LocationDTO {
  @IsNumber()
  @IsLongitude()
  @Min(-180)
  @Max(80)
  public longitude:number;
  
  @IsNumber()
  @IsLatitude()
  @Min(-90)
  @Max(90)
  public latitude:number;

}

export default LocationDTO;