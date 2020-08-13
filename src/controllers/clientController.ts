import * as bcrypt from 'bcrypt';
import * as express from 'express';
import * as generatePassword from 'generate-password';
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IRequestOffer from './../interfaces/request/IRequestOffer';
import IController from '../interfaces/IController';
import IUser from '../interfaces/user/IUser';
import IClient from '../interfaces/user/IClient';
import IRequestWithClient from '../interfaces/httpRequest/IRequestWithClient';
import IAddress from './../interfaces/user/IAddress';
/////////////////////////////////////////
import helperModel from './../models/user/Helper';
import clientModel from '../models/user/Client';
/////////////////////////////////////////
import ClientRegistrationDTO from '../dto/clientDTO/clientRegistrationDTO';
import CancelRequestDTO from './../dto/requestDTO/CancelRequestDTO';
import LogInDto from '../dto/loginDTO';
import UpdateClientDTO from '../dto/clientDTO/updateClientDTO';
import AddAddressDTO from './../dto/clientDTO/AddAddressDTO';
/////////////////////////////////////////
import WrongCredentialsException from '../exceptions/account/WrongCredentialsException';
import UserWithThatEmailAlreadyExistsException from '../exceptions/account/UserWithThatEmailAlreadyExistsException';
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import UserIsNotApprovedException from '../exceptions/account/UserIsNotApprovedException';
////////////////////////////////////////
import sendEmail from '../modules/sendEmail';
import TokenManager from '../modules/tokenManager';
import Response from '../modules/Response';
import { awsService } from './../middlewares/upload';
import requestModel from './../models/request/Request';
import IRequest from './../interfaces/request/IRequest';
import {
  WAITING_FOR_OFFERS,
  WAITING_FOR_HELPER_START,
  WAITING_FOR_CLIENT_APPROVAL,
  WAITING_FOR_CLIENT_PAYMENT,
  WAITING_FOR_FINISH_REQUEST,
} from './../types/ClientTypes';
import { Types } from 'mongoose';
import HttpException from '../exceptions/HttpException';
import requestOfferModel from './../models/request/RequestOffer';
import resetPasswordDTO from './../dto/resetPasswordDTO';

class ClientController implements IController {
  public path: string;
  public router: express.IRouter;
  private tokenManager: TokenManager;
  private mailer: sendEmail;
  constructor() {
    this.path = '/Client';
    this.router = express.Router();
    this.tokenManager = new TokenManager();
    this.mailer = new sendEmail();
    this.initializeRoutes();
  }
  private initializeRoutes() {
    this.router.post(
      `${this.path}/Login`,
      validationMiddleware(LogInDto),
      this.login
    );
    this.router.post(
      `${this.path}/Register`,
      validationMiddleware(ClientRegistrationDTO),
      this.register
    );
    this.router.post(
      `${this.path}/Address`,
      authMiddleware,
      validationMiddleware(AddAddressDTO),
      this.addAddress
    );
    this.router.post(
      `${this.path}/CancelRequest`,
      authMiddleware,
      validationMiddleware(CancelRequestDTO, true),
      this.cancelRequest
    );
    this.router.post(
      `${this.path}/ResetPassword`,
      validationMiddleware(resetPasswordDTO),
      this.resetPassword
    );
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.router.get(`${this.path}`, authMiddleware, this.getAccount);
    this.router.get(
      `${this.path}/SavedAddresses`,
      authMiddleware,
      this.getSavedAddresses
    );
    this.router.get(
      `${this.path}/LockDownStatus`,
      authMiddleware,
      this.getLockDownStatus
    );
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.router.patch(
      `${this.path}`,
      authMiddleware,
      awsService.single('profilePicture'),
      validationMiddleware(UpdateClientDTO, true),
      this.updateAccount
    );
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.router.delete(
      `${this.path}/Address/:_id`,
      authMiddleware,
      this.deleteAddress
    );
  }
  private getAccount = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const {
      firstName,
      lastName,
      birthDate,
      email,
      gender,
      mobile,
      balance,
      profilePicture,
    } = request.user;
    response.status(200).send(
      new Response(undefined, {
        firstName,
        lastName,
        birthDate,
        email,
        gender,
        mobile,
        balance,
        profilePicture,
      }).getData()
    );
  };
  private formateGeoAddresses = (addresses: IAddress[]) => {
    let savedAddresses = [];
    for (let i = 0; i < addresses.length; i++) {
      savedAddresses.push({
        _id: addresses[i]._id,
        name: addresses[i].name,
        addressName: addresses[i].addressName,
        location: {
          longitude: addresses[i].location.coordinates[0],
          latitude: addresses[i].location.coordinates[1],
        },
      });
    }

    return savedAddresses;
  };
  private getSavedAddresses = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    response.status(200).send(
      new Response(undefined, {
        savedAddresses: this.formateGeoAddresses(request.user.savedAddresses),
      }).getData()
    );
  };
  private deleteAddress = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const _id = request.params._id;
    if (Types.ObjectId.isValid(_id)) {
      request.user.savedAddresses = request.user.savedAddresses.filter(
        (address: IAddress) => {
          return address._id != _id;
        }
      );
      await request.user
        .save()
        .then((user: IUser) => {
          response
            .status(200)
            .send(new Response('Address Deleted Successfully').getData());
        })
        .catch((err) => {
          next(new SomethingWentWrongException(err));
        });
    } else {
      next(new HttpException(400, 'Invalid Address _id'));
    }
  };
  private addAddress = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const address: AddAddressDTO = request.body;
    const addressGeoFormat = {
      ...address,
      location: {
        type: 'Point',
        coordinates: [address.location.longitude, address.location.latitude],
      },
    };
    request.user.savedAddresses.push(addressGeoFormat);
    await request.user
      .save()
      .then((client: IClient) => {
        if (client) {
          response
            .status(201)
            .send(
              new Response('Address Added Successfully', undefined).getData()
            );
        } else {
          next(new SomethingWentWrongException());
        }
      })
      .catch((err) => {
        next(new SomethingWentWrongException(err));
      });
  };
  private updateAccount = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    let newData: UpdateClientDTO = request.body;
    let newObj = newData;
    request.file ? (newObj['profilePicture'] = request.file['location']) : null;
    let emailUpdated: boolean = true;
    if (request.user.email == newObj.email) emailUpdated = false;
    const verificationToken = this.tokenManager.getToken({
      email: newObj.email ? newObj.email : request.user.email,
    });
    await clientModel
      .findByIdAndUpdate(
        request.user._id,
        {
          $set: newData,
          isApproved: !emailUpdated,
          verificationToken: verificationToken,
        },
        { new: true }
      )
      .then(async (client: IClient) => {
        if (!client.isApproved) {
          await this.mailer
            .sendRegistrationMail(
              client.firstName,
              client.verificationToken,
              client.email,
              client.role
            )
            .then((result) => {
              response
                .status(201)
                .send(
                  new Response(
                    'Client Registered Successfully\nPlease Verify Your Email!'
                  ).getData()
                );
            });
        } else if (client) {
          response
            .status(200)
            .send(new Response('Updated Successfuly!').getData());
        } else {
          next(new SomethingWentWrongException());
        }
      })
      .catch((err) => {
        next(new SomethingWentWrongException());
      });
  };
  private register = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const userData: ClientRegistrationDTO = request.body;
    await clientModel
      .findOne({ email: userData.email.toLowerCase() })
      .then(async (value: IUser) => {
        if (value) {
          next(new UserWithThatEmailAlreadyExistsException(userData.email));
        } else {
          await clientModel
            .create({
              ...userData,
            })
            .then(async (client: IClient) => {
              client.password = undefined;
              await this.mailer
                .sendRegistrationMail(
                  client.firstName,
                  client.verificationToken,
                  client.email,
                  client.role
                )
                .then((result) => {
                  response
                    .status(201)
                    .send(
                      new Response(
                        'Client Registered Successfully\nPlease Verify Your Email!'
                      ).getData()
                    );
                })
                .catch((result) => {
                  response
                    .status(201)
                    .send(new Response('Registered Successfully!').getData());
                });
            })
            .catch((err) => {
              next(new SomethingWentWrongException(err));
            });
        }
      })
      .catch((err) => {
        next(new SomethingWentWrongException(err));
      });
  };
  private login = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const logInData: LogInDto = request.body;
    await clientModel
      .findOne({ email: logInData.email })
      .then(async (client: IClient) => {
        if (client) {
          await bcrypt
            .compare(logInData.password, client.password)
            .then(async (isPasswordMatching: boolean) => {
              if (isPasswordMatching) {
                client.password = undefined;
                if (client.isApproved) {
                  const token = this.tokenManager.getToken({ _id: client._id });
                  response
                    .status(200)
                    .send(new Response('Login success', { token }).getData());
                } else {
                  await this.mailer
                    .sendRegistrationMail(
                      client.firstName,
                      client.verificationToken,
                      client.email,
                      client.role
                    )
                    .then((result) => {
                      next(new UserIsNotApprovedException(client.email));
                    })
                    .catch((result) => {
                      next(new SomethingWentWrongException());
                    });
                }
              } else {
                next(new WrongCredentialsException());
              }
            })
            .catch((err) => {
              next(new SomethingWentWrongException());
            });
        } else {
          next(new WrongCredentialsException());
        }
      })
      .catch((err) => {
        next(new SomethingWentWrongException(err));
      });
  };
  private getLockDownStatus = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await requestModel
        .findById(request.user.activeRequest)
        .then((req: IRequest) => {
          if (!req.acceptedState.acceptedOffer) {
            response.status(200).send(
              new Response(undefined, {
                isLockedDown: true,
                type: WAITING_FOR_OFFERS,
              }).getData()
            );
          } else if (!req.acceptedState.helperStarted) {
            response.status(200).send(
              new Response(undefined, {
                isLockedDown: true,
                type: WAITING_FOR_HELPER_START,
              }).getData()
            );
          } else if (!req.acceptedState.clientApproved) {
            response.status(200).send(
              new Response(undefined, {
                isLockedDown: true,
                type: WAITING_FOR_CLIENT_APPROVAL,
              }).getData()
            );
          } else if (!req.finishedState.isFinished) {
            response.status(200).send(
              new Response(undefined, {
                isLockedDown: true,
                type: WAITING_FOR_FINISH_REQUEST,
              }).getData()
            );
          } else if (req.finishedState.isFinished) {
            response.status(200).send(
              new Response(undefined, {
                isLockedDown: true,
                type: WAITING_FOR_CLIENT_PAYMENT,
              }).getData()
            );
          }
        })
        .catch((err) => {
          next(new SomethingWentWrongException(err));
        });
    } else {
      response
        .status(200)
        .send(new Response(undefined, { isLockedDown: false }).getData());
    }
  };
  private resetPassword = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const userData: resetPasswordDTO = request.body;
    console.log(userData);
    await clientModel
      .findOne({ email: userData.email })
      .then(async (client: IClient) => {
        console.log(client);
        const newPassword = generatePassword.generate({
          length: 10,
          numbers: true,
        });
        client.password = newPassword;
        await client
          .save()
          .then(async (c: IClient) => {
            await this.mailer
              .sendMail(
                client.email,
                'Password Reset',
                'Dear ' +
                  client.firstName +
                  ' \n' +
                  'Your New Password Is : ' +
                  newPassword
              )
              .then((value: boolean) => {
                response
                  .status(201)
                  .send(
                    new Response(
                      'Password Reset Succeded, We Sent A New Password To Your Email'
                    )
                  );
              })
              .catch((err) => {
                next(new SomethingWentWrongException(err));
              });
          })
          .catch((err) => {
            next(new SomethingWentWrongException(err));
          });
      })
      .catch((err) => {
        next(new HttpException(404, 'No Such User With That Email'));
      });
  };
  private cancelRequest = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const { message } = request.body;
    if (request.user.activeRequest) {
      await requestModel
        .findByIdAndUpdate(request.user.activeRequest, {
          $set: {
            canceledState: {
              isCanceled: true,
              canceledUser: request.user._id,
              message: message,
            },
          },
        })
        .then(async (req: IRequest) => {
          const requests = request.user.requests.filter((_id: string) => {
            return _id !== req._id;
          });
          await clientModel
            .findByIdAndUpdate(request.user._id, {
              $set: { requests: requests },
              $unset: { activeRequest: 1 },
            })
            .then(async (client: IClient) => {
              for (let i = 0; i < req.offers.length; i++) {
                await requestOfferModel
                  .findByIdAndDelete(req.offers[i])
                  .then(async (offer: IRequestOffer) => {
                    await helperModel.findByIdAndUpdate(offer.helperID, {
                      $unset: { activeRequest: 1, currentOffer: 1 },
                      $pull: { requests: req._id },
                    });
                  })
                  .catch((err) => {
                    next(new SomethingWentWrongException(err));
                  });
              }
              response
                .status(200)
                .send(new Response('Request Canceled').getData());
            })
            .catch((err) => {
              next(new SomethingWentWrongException(err));
            });
        })
        .catch((err) => {
          next(new SomethingWentWrongException(err));
        });
    } else {
      next(new HttpException(400, 'You Have No Active Request'));
    }
  };
}
export default ClientController;
