import { IsString, IsBoolean } from 'class-validator';

class AdminMessageDTO {
    @IsString()
    public message: string;
    @IsString()
    public ticketID: string;
    @IsBoolean()
    public closed: boolean;
}

export default AdminMessageDTO;