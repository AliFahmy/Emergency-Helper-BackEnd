import * as bcrypt from 'bcrypt';
import * as express from 'express';
import { Types } from 'mongoose';
/////////////////////////////////////////
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
import IUser from '../interfaces/user/IUser';
import ISupportTicketCategory from '../interfaces/ISupportTicketCategory';
import ISupportTicket from '../interfaces/ISupportTicket';
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';

/////////////////////////////////////////
import userModel from '../models/user/User';
import clientModel from './../models/user/Client';
import helperModel from './../models/user/Helper';
import supportTicketCategoryModal from '../models/request/SupportTicketCategory';
import supportTicketModel from '../models/request/SupportTicket';
/////////////////////////////////////////
import UpdatePasswordDTO from '../dto/UpdatePasswordDTO';
import SupportCategoryDTO from '../dto/SupportCategoryDTO';
import CreateSupportTicketDTO from '../dto/CreateSupportTicketDTO';
import MessageDTO from '../dto/MessageDTO';
/////////////////////////////////////////
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import OldPasswordDosentMatchException from '../exceptions/account/OldPasswordDosentMatchException';
import WrongCredentialsException from './../exceptions/account/WrongCredentialsException';
import SupportCategoryAlreadyExistsException from './../exceptions/account/SupportCategoryAlreadyExistsException';

////////////////////////////////////////
import sendEmail from '../modules/sendEmail';
import TokenManager from '../modules/tokenManager';
import Response from '../modules/Response';
import * as jwt from 'jsonwebtoken';
class AccountController implements IController {
    public path: string;
    public router: express.IRouter;
    public tokenManager: TokenManager;
    public mailer: sendEmail;
    constructor() {
        this.path = '/Account';
        this.router = express.Router();
        this.initializeRoutes();
        this.tokenManager = new TokenManager();
        this.mailer = new sendEmail();
    }
    private initializeRoutes() {
        this.router.get(`${this.path}/ValidateToken`, authMiddleware, this.validateToken);
        this.router.get(`${this.path}/VerifyAccount/:verificationToken/:role`, this.verifyAccount);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.patch(`${this.path}/ChangePassword`, authMiddleware, validationMiddleware(UpdatePasswordDTO), this.updatePassword);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.post(`${this.path}/SupportCategory`, authMiddleware, validationMiddleware(SupportCategoryDTO), this.insertSupportCategory);
        this.router.get(`${this.path}/AllSupportCategories`, authMiddleware, this.getAllSupportCategories);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.get(`${this.path}/GetTickets`, authMiddleware, this.getTickets);
        this.router.post(`${this.path}/CreateSupportTicket`, authMiddleware, validationMiddleware(CreateSupportTicketDTO, true), this.CreateSupportTicket);
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.router.post(`${this.path}/AddMessage`, authMiddleware, validationMiddleware(MessageDTO), this.addMessage);
        this.router.get(`${this.path}/GetTicketMsgs/:id`, authMiddleware, this.GetTicketMsgs);

    }
    private GetTicketMsgs = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const ticketID = request.params.id;
        await supportTicketModel.findById(ticketID)
            .then(async (ticket) => {
                if (ticket) {
                    response.status(200).send(new Response(undefined, { ...ticket.toObject().messages }).getData());
                }
                else {
                    next(new SomethingWentWrongException())
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }
    private addMessage = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const message: MessageDTO = request.body;
        const newMessage = { message: message.message, date: new Date(), senderRole: request.user.role, senderID: request.user._id, senderName: request.user.firstName + " " + request.user.lastName }
        await supportTicketModel.findById(message.ticketID)
            .then(async (ticket) => {
                if (ticket) {
                    ticket.messages.push(newMessage)
                    ticket.save().then(() => {
                        response.status(200).send(new Response('Added Message Succesfully', undefined).getData());
                    })
                        .catch(err => {
                            next(new SomethingWentWrongException(err))
                        })
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }

    private validateToken = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        response.status(200).send(new Response(undefined, { result: true }).getData());
    }
    private CreateSupportTicket = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        let supportTicket: CreateSupportTicketDTO = request.body;
        const initialMessage = { message: supportTicket.description, date: new Date(), senderRole: request.user.role, senderID: request.user._id, senderName: request.user.firstName + " " + request.user.lastName }

        await supportTicketModel.create({ ...supportTicket, client: request.user._id, date: new Date(), messages:[initialMessage]})
            .then(async (ticket: ISupportTicket) => {
                if (ticket) {
                    request.user.supportTickets.push(ticket._id)
                    await request.user.save()
                        .then(async (user: IUser) => {
                            if (user) {
                                response.status(201).send(new Response('Created Ticket Successfully').getData());
                            }
                            else {
                                next(new SomethingWentWrongException())
                            }
                        })
                        .catch((err) => {
                            next(new SomethingWentWrongException(err))
                        })
                }
                else {
                    next(new SomethingWentWrongException())
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })

    }
    private GetTickets = async (supportTicketsIDs: Types.ObjectId[]): Promise<string[]> => {
        let supportTickets: any = [];
        for (let i in supportTicketsIDs) {
            await supportTicketModel.findById(supportTicketsIDs[i], { description: 1, category: 1, date: 1 }).then((ticket: ISupportTicket) => {
                supportTickets.push(ticket);
            });
        }
        return supportTickets;
    }
    private getTickets = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        let formatedSupportTickets: any = []
        await userModel.findById(request.user._id, { supportTickets: 1 })
            .then(async (supportTickets) => {
                if (supportTickets) {
                    let supportTicketsIDs = { ...supportTickets.toObject().supportTickets }
                    await this.GetTickets(supportTicketsIDs).then((supportTickets: string[]) => {
                        formatedSupportTickets = supportTickets.slice();
                    }).catch(err => {
                        formatedSupportTickets = [];
                    });
                    response.status(200).send(new Response(undefined, { formatedSupportTickets }).getData());
                }
                else {
                    next(new SomethingWentWrongException())
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }
    private getAllSupportCategories = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        await supportTicketCategoryModal.find({}, '-_id -createdAt -updatedAt -__v')
            .then((categories: ISupportTicketCategory[]) => {
                if (categories) {
                    response.status(200).send(new Response(undefined, { categories }).getData());
                }
                else {
                    next(new SomethingWentWrongException())
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }
    private insertSupportCategory = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const supportCategoryDTO: SupportCategoryDTO = request.body;
        await supportTicketCategoryModal.findOne({ name: supportCategoryDTO.name })
            .then(async (category: ISupportTicketCategory) => {
                if (category) {
                    next(new SupportCategoryAlreadyExistsException());
                }
                else {
                    await supportTicketCategoryModal.create(supportCategoryDTO)
                        .then((category: ISupportTicketCategory) => {
                            if (category) {
                                response.status(201).send(new Response('Created Category Successfully').getData());
                            }
                            else {
                                next(new SomethingWentWrongException());
                            }
                        })
                        .catch(err => {
                            next(new SomethingWentWrongException(err))
                        })
                }
            })
            .catch(err => {
                next(new SomethingWentWrongException(err))
            })
    }

    private verifyAccount = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        const token = request.params.verificationToken;
        const role = request.params.role;
        let model = undefined;
        if (role === 'Client') {
            model = clientModel;
        }
        else if (role === 'Helper') {
            model = helperModel
        }
        else {
            next(new WrongCredentialsException())
            return;
        }
        this.tokenManager.validateToken(token)
            .then(async decoded => {
                await model.findOne({ email: decoded['email'] }, async (err: any, user: IUser) => {
                    if (err) {
                        next(err);
                    }
                    else {
                        if (user.isApproved) {
                            response.status(200).send(new Response('User Already Verified!').getData());
                        }
                        else {
                            user.isApproved = true;
                            await user.save((err) => {
                                if (err) {
                                    console.log(err);
                                    next(new SomethingWentWrongException());
                                }
                                else {
                                    response.status(201).send(new Response('Verified Successfully!').getData());
                                }
                            })
                        }
                    }
                })
            }).catch(result => {
                console.log(result);
                next(new SomethingWentWrongException());
            });
    }
    private updatePassword = async (request: IRequestWithUser, response: express.Response, next: express.NextFunction) => {
        let newPassword: UpdatePasswordDTO = request.body;
        let User = await userModel.findById(request.user._id);
        const isPasswordMatching = await bcrypt.compare(newPassword.oldPassword, User.password);
        if (isPasswordMatching) {
            User.password = await bcrypt.hash(newPassword.newPassword, 10);
            await User.save((err) => {
                if (err) {
                    next(new SomethingWentWrongException())
                } else {
                    response.status(200).send(new Response('Password Updated Successfully!').getData());
                }
            })
        } else {
            next(new OldPasswordDosentMatchException())
        }
    }
}
export default AccountController;
