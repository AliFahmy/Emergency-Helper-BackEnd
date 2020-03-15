import HttpException from './HttpException';

class OldPasswordDosentMatchException extends HttpException {
  constructor() {
    super(400, 'Old Password Dosent Match');
  }
}

export default OldPasswordDosentMatchException;