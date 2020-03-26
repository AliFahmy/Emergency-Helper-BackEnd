import HttpException from './HttpException';

class HelperCategoryAlreadyExistsException extends HttpException {
  constructor() {
    super(400, 'Helper Category Already Exists');
  }
}

export default HelperCategoryAlreadyExistsException;