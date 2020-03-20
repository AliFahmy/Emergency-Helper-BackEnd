import { IsString} from 'class-validator';

class CategoryDTO {
  @IsString()
  public name: string;
}

export default CategoryDTO;