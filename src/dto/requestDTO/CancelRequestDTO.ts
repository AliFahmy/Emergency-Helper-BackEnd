import { IsMongoId} from 'class-validator';

class RequestDTO {
  @IsMongoId()
  public _id: string;
}

export default RequestDTO;