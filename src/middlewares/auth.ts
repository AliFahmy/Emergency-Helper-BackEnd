import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import IDataStoredInToken from '../interfaces/token/IDataStoredInToken';
import IRequestWithUser from '../interfaces/request/IRequestWithUser';
import userModel from './../models/user';


async function authMiddleware(request: IRequestWithUser, response: Response, next: NextFunction) {
    const cookies = request.cookies;
    if(cookies && cookies.Authorization){
        const secret = process.env.JWT_SECRET;
        try{
            const verificationResponse = jwt.verify(cookies.Authorization,secret) as IDataStoredInToken;
            const id = verificationResponse._id;
            const user = await userModel.findById(id);
            if(user){
                request.user = user;
                next();
            }else{
                next(new WrongAuthenticationTokenException());
            }
        }catch(error){
            next(new WrongAuthenticationTokenException());
        }
    }else{
        next(new AuthenticationTokenMissingException());
    }
}

export default authMiddleware;