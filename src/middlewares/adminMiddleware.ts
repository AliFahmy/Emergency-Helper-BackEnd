import { NextFunction, Response } from 'express';
import IRequestWithAdmin from '../interfaces/httpRequest/IRequestWithAdmin';
import adminModel from './../models/user/Admin';
import * as jwt from 'jsonwebtoken';
import SomethingWentWrongException from '../exceptions/SomethingWentWrongException';
import IAdmin from './../interfaces/user/IAdmin';
import IDataStoredInToken from './../interfaces/token/IDataStoredInToken';
import AuthenticationTokenMissingException from '../exceptions/auth/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/auth/WrongAuthenticationTokenException';



async function adminMiddleware(request: IRequestWithAdmin, response: Response, next: NextFunction) {
    const headers = request.headers;
    if(headers["authorization"]){
        const secret = process.env.JWT_SECRET;
        try{
            const verificationResponse =  jwt.verify(headers['authorization'].split(" ")[1],secret) as IDataStoredInToken;
            const _id = verificationResponse._id;
            await adminModel.findById(_id,'-password -createdAt -updatedAt -__v',(err,admin:IAdmin)=>{
                if(err){
                    next(new SomethingWentWrongException(err));
                }
                else{
                    request.user = admin;
                    next();
                }
            });
        }catch(error){
            next(new WrongAuthenticationTokenException());
        }
    }else{
        next(new AuthenticationTokenMissingException());
    }
}

export default adminMiddleware;
