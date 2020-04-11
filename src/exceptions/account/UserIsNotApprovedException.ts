import HttpException from '../HttpException';

class UserIsNotApprovedException extends HttpException {
  constructor(email:string) {
    super(401, `User Is Not Verified,We Sent an verification email to ${email}`);
  }
}

export default UserIsNotApprovedException;