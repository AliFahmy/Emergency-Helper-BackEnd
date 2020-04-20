import * as jwt from 'jsonwebtoken';
export default class TokenManager {
    private secret:Buffer;
    constructor(){
        this.secret = new Buffer(process.env.JWT_SECRET, 'base64');
    }
    public getToken(data={}){
        return jwt.sign(data,this.secret)
    }
    public validateToken(token:any):Promise<any>{
        console.log(typeof(token));
        return new Promise((resolve,reject)=>{
            jwt.verify(token,this.secret,(err:any,decoded)=>{
                if(err){
                    console.log(err);
                    reject(false);
                }
                else{
                    resolve(decoded);
                }
            })
        })
    }
}
