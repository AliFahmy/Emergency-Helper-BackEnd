import HttpException from '../HttpException';

class SupportCategoryAlreadyExistsException extends HttpException {
  constructor() {
    super(409, 'Support Category Already Exists');
  }
}

export default SupportCategoryAlreadyExistsException;