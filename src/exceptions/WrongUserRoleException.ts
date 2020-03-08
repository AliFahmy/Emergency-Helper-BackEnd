import HttpException from './HttpException';

class WrongUserRoleException extends HttpException {
  constructor() {
    super(401, 'Wrong User Role provided');
  }
}

export default WrongUserRoleException;