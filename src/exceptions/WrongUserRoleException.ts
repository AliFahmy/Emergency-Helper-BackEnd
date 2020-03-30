import HttpException from './HttpException';

class WrongUserRoleException extends HttpException {
  constructor() {
    super(422, 'Invalid User Role');
  }
}

export default WrongUserRoleException;