import * as nodemailer from 'nodemailer';

class sendEmail {
    private _transporter: nodemailer.Transporter;
    constructor() {
        this._transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email,
                pass: process.env.password  
            }
        });
    }
    public sendMail(to: string, subject: string, content: string) : Promise<boolean>{
        let options = {
            from: '"Emergency Helper" <EmergencyHelperStartup@gmail.com>',
            to: to,
            subject: subject,
            text: content
        }
        return new Promise((resolve,reject)=>{
            this._transporter.sendMail(
                options,(error, info) => {
                    if (error) {
                        reject(false)
                    }
                    else{
                        resolve(true)
                    }
                });
        })
        }
    public async sendRegistrationMail(name:string,token:string,email:string):Promise<boolean>{
            const url = `https://emergency-helper.herokuapp.com/api/Account/VerifyAccount/${token}`;
            const body = `Dear ${name},\n Thank you for registiring in Emergency Helper, in order to confirm your account please follow this link ${url}.\n Thanks \n Emergency Helper Team `
            return await this.sendMail(email,"Emergency Helper Confirmation Required",body).then(result=>result).catch(result=>result);
        }
}

export default sendEmail;
