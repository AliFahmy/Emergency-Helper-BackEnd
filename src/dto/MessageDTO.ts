import { IsString } from 'class-validator';

class MessageDTO {
    @IsString()
    public message: string;
    @IsString()
    public ticketID: string;
}

export default MessageDTO;