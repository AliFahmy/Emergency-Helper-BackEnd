import HttpException from './HttpException';

class UpdateAccountException extends HttpException {
  constructor(email:string) {
    super(400, `Something Went Wrong While Updating User With Email :${email}`);
  }
}

export default UpdateAccountException;