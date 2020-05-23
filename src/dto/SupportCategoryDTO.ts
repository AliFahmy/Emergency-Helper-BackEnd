import { IsString } from 'class-validator';

class SupportCategoryDTO {
  @IsString()
  public name: string;

}

export default SupportCategoryDTO;