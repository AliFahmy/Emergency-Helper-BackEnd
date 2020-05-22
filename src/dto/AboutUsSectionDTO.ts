import { IsString } from 'class-validator';

class AboutUsSectionDTO {
  @IsString()
  public title: string;
  @IsString()
  public description: string;
}

export default AboutUsSectionDTO;