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
    sendMail(to: string, subject: string, content: string) {
        let options = {
            from: '"Emergency Helper" <omar@omar.com>',
            to: to,
            subject: subject,
            text: content
        }

        this._transporter.sendMail(
            options, (error, info) => {
                if (error) {
                    return console.log(`error: ${error}`);
                }
                console.log(`Message Sent ${info.response}`);
            });
    }
}

export default sendEmail;
