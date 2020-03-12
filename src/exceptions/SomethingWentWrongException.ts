import HttpException from './HttpException';

class SomethingWentWrongException extends HttpException {
  constructor() {
    super(500, 'Something Went Wrong');
  }
}

export default SomethingWentWrongException;