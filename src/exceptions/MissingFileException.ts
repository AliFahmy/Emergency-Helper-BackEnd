import HttpException from './HttpException';

class CouldntSaveToDataBaseException extends HttpException {
  constructor() {
    super(400, 'Couldnt Save To DataBase');
  }
}

export default CouldntSaveToDataBaseException;