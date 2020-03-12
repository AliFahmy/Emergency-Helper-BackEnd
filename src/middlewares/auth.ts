import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import IDataStoredInToken from '../interfaces/token/IDataStoredInToken';
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
import userModel from '../models/User';


async function authMiddleware(request: IRequestWithUser, response: Response, next: NextFunction) {
    const headers = request.headers;
    if(headers && headers["authorization"]){
        const secret = process.env.JWT_SECRET;
        try{
            const verificationResponse = jwt.verify(headers['authorization'].split(" ")[1],secret) as IDataStoredInToken;
            const _id = verificationResponse._id;
            const user = await userModel.findById(_id,'-_id -password -createdAt -updatedAt -__v');
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