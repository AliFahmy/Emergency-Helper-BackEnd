import { IsArray, IsNotEmpty} from 'class-validator';
import IItem from './../../interfaces/request/IItem';

class FillReceiptDTO {
    @IsArray()
    @IsNotEmpty()
    public items:IItem[]
}

export default FillReceiptDTO;