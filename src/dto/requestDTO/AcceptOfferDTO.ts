import { IsMongoId} from 'class-validator';
class AcceptOfferDTO {
    @IsMongoId()
    offerID:string;  
}

export default AcceptOfferDTO;