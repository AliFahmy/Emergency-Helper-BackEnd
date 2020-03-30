import HttpException from './HttpException';

class UpdatePictureException extends HttpException {
  constructor() {
    super(400, `Something Went Wrong While Updating User Picture `);
  }
}

export default UpdatePictureException;