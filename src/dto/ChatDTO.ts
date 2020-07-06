import { IsString } from 'class-validator';

class ChatDTO {
    @IsString()
    public message: string;
}

export default ChatDTO;