import HttpException from './HttpException';

class WrongCredentialsException extends HttpException {
  constructor() {
    super(401, "Incorrect Email Or Password");
  }
}

export default WrongCredentialsException;