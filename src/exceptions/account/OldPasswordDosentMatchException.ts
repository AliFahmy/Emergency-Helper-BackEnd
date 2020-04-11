import HttpException from '../HttpException';

class OldPasswordDosentMatchException extends HttpException {
  constructor() {
    super(409, 'Old Password Dosent Match');
  }
}

export default OldPasswordDosentMatchException;