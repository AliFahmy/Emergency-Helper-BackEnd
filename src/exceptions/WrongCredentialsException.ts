import HttpException from './HttpException';

class WrongCredentialsException extends HttpException {
  constructor() {
    super(404, 'Wrong credentials provided');
  }
}

export default WrongCredentialsException;