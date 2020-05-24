import { IsString, IsISO8601 } from 'class-validator';

class SupportCategoryDTO {
    @IsString()
    public description: string;

    @IsString()
    public request: string;

    @IsString()
    public category: string;

}

export default SupportCategoryDTO;