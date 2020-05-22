import * as jwt from 'jsonwebtoken';
export default class TokenManager {
    private secret:string;
    constructor(){
        this.secret = process.env.JWT_SECRET;
    }
    public getToken(data={}){
        return jwt.sign(data,this.secret)
    }
    public validateToken(token:any):Promise<any>{
        return new Promise((resolve,reject)=>{
            jwt.verify(token,this.secret,(err:any,decoded)=>{
                if(err){
                    reject(false);
                }
                else{
                    resolve(decoded);
                }
            })
        })
    }
}