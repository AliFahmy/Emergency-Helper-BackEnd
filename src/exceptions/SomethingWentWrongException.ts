import HttpException from './HttpException';

class SomethingWentWrongException extends HttpException {
  constructor(error?:string) {
    super(500, error? error : 'Something Went Wrong');
  }
}

export default SomethingWentWrongException;