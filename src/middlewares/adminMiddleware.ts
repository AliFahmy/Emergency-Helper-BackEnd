import { NextFunction, Response } from 'express';
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
import NotAuthorizedAdminException from '../exceptions/NotAuthorizedAdminException';

async function adminMiddleware(request: IRequestWithUser, response: Response, next: NextFunction) {
    if(request.user.role === "Admin"){
        next();
    }else{
        next(new NotAuthorizedAdminException());
    }
}

export default adminMiddleware;
