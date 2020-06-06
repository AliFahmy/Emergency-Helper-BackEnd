import { IsNumber} from 'class-validator';
class ViewNearbyRequestsDTO {
    @IsNumber()
    public radius:number;  
}

export default ViewNearbyRequestsDTO;