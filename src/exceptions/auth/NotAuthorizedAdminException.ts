import HttpException from '../HttpException';

class NotAuthorizedAdminException extends HttpException {
  constructor() {
    super(401, 'Not Authorized Admin');
  }
}

export default NotAuthorizedAdminException;