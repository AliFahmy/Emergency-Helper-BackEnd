import {IsBase64} from 'class-validator';

class UpdatePictureDTO {
   @IsBase64()
   public picture :string;
}

export default UpdatePictureDTO;