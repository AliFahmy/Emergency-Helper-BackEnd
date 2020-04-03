import * as nodemailer from 'nodemailer';

export class sendEmail {
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
    public async sendMail(to: string, subject: string, content: string){
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
                        resolve(false)
                    }
                    else{
                        resolve(true)
                    }
                });
        })
        }
}

export default sendEmail;
