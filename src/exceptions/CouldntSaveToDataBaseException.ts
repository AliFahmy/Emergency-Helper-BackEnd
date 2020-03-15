import HttpException from './HttpException';

class MissingFileException extends HttpException {
  constructor() {
    super(400, 'File Wasnt Provided');
  }
}

export default MissingFileException;