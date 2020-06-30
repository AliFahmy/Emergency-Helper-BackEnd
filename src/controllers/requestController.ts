import * as express from 'express';
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
import IUser from '../interfaces/user/IUser';
import IRequest from '../interfaces/request/IRequest';
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
/////////////////////////////////////////
import requestModel from '../models/request/Request';
/////////////////////////////////////////
import RequestDTO from '../dto/requestDTO/RequestDTO';
import MakeOfferDTO from './../dto/requestDTO/MakeOfferDTO';
/////////////////////////////////////////
import SomethingWentWrongException from './../exceptions/SomethingWentWrongException';
import HttpException from './../exceptions/HttpException';
////////////////////////////////////////
import Response from '../modules/Response';
import AcceptOfferDTO from './../dto/requestDTO/AcceptOfferDTO';
import helperModel from './../models/user/Helper';
import IHelper from './../interfaces/user/IHelper';
import IRequestWithHelper from './../interfaces/httpRequest/IRequestWithHelper';
import requestOfferModel from './../models/request/RequestOffer';
import IRequestOffer from './../interfaces/request/IRequestOffer';
import CancelRequestDTO from './../dto/requestDTO/CancelRequestDTO';
import { checkOfferTime } from './../utils/checkOfferTime';

class RequestController implements IController {
  public path: string;
  public router: express.IRouter;
  constructor() {
    this.path = '/Request';
    this.router = express.Router();
    this.initializeRoutes();
  }
  private initializeRoutes() {
    this.router.post(
      `${this.path}`,
      authMiddleware,
      validationMiddleware(RequestDTO),
      this.createRequest
    );
    this.router.post(
      `${this.path}/CancelRequest`,
      authMiddleware,
      validationMiddleware(CancelRequestDTO, true),
      this.cancelRequest
    );
    this.router.post(
      `${this.path}/MakeOffer`,
      authMiddleware,
      validationMiddleware(MakeOfferDTO),
      this.makeOffer
    );
    this.router.post(
      `${this.path}/CancelOffer`,
      authMiddleware,
      this.cancelOffer
    );
    this.router.post(
      `${this.path}/AcceptOffer`,
      authMiddleware,
      validationMiddleware(AcceptOfferDTO),
      this.acceptOffer
    );
    ///////////////////////////////////////////////////////////////////////////////////////////
    this.router.get(
      `${this.path}/ActiveRequest`,
      authMiddleware,
      this.getCurrentRequest
    );
    this.router.get(`${this.path}/ViewOffers`, authMiddleware, this.viewOffers);
    this.router.get(
      `${this.path}/ViewHistory`,
      authMiddleware,
      this.viewHistory
    );
  }
  private createRequest = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const newRequest: RequestDTO = request.body;
    if (request.user.activeRequest) {
      next(
        new HttpException(
          404,
          'Cant Create Request, You Already Have Active One'
        )
      );
    } else {
      await requestModel
        .create({
          ...newRequest,
          client: request.user._id,
          clientName: request.user.firstName + ' ' + request.user.lastName,
          date: new Date(),
          location: {
            type: 'Point',
            coordinates: [
              newRequest.location.longitude,
              newRequest.location.latitude,
            ],
          },
        })
        .then(async (req: IRequest) => {
          if (req) {
            request.user.requests.push(req._id);
            request.user.activeRequest = req._id;
            await request.user
              .save()
              .then(async (user: IUser) => {
                if (user) {
                  response
                    .status(201)
                    .send(
                      new Response('Created Request Successfully').getData()
                    );
                } else {
                  await requestModel
                    .findByIdAndRemove(req._id)
                    .then((req: IRequest) => {
                      next(
                        new SomethingWentWrongException(
                          "Couldn't Create Request At The Moment"
                        )
                      );
                    })
                    .catch((err) => {
                      next(new SomethingWentWrongException(err));
                    });
                }
              })
              .catch((err) => {
                next(new SomethingWentWrongException(err));
              });
          } else {
            next(new SomethingWentWrongException());
          }
        })
        .catch((err) => {
          next(new SomethingWentWrongException(err));
        });
    }
  };
  private cancelRequest = async (
    request: IRequestWithUser,
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
          if (req) {
            request.user.activeRequest = undefined;
            await request.user.save().then((user: IUser) => {
              if (user) {
                response
                  .status(200)
                  .send(new Response('Canceled Request').getData());
              } else {
                next(new HttpException(400, 'Couldnt Save User'));
              }
            });
          } else {
            next(new HttpException(404, "Couldn't Cancel Request"));
          }
        })
        .catch((err) => {
          next(new SomethingWentWrongException(err));
        });
    } else {
      next(new HttpException(400, 'You Have No Active Request'));
    }
  };
  private async getActiveRequest(user: IUser): Promise<IRequest> {
    return new Promise<IRequest>(async (resolve, reject) => {
      await requestModel
        .findById(
          user.activeRequest,
          '-createdAt -updatedAt -__v -supportTickets -client'
        )
        .then((Request: IRequest) => {
          resolve(Request);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  private getCurrentRequest = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    await this.getActiveRequest(request.user)
      .then((req: IRequest) => {
        if (req) {
          response
            .status(200)
            .send(new Response(undefined, { ...req.toObject() }).getData());
        } else {
          next(new HttpException(404, 'User Has No Active Request'));
        }
      })
      .catch((err) => {
        next(new SomethingWentWrongException(err));
      });
  };
  private makeOffer = async (
    request: IRequestWithHelper,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const offer: MakeOfferDTO = request.body;
    if (request.user.role === 'Helper') {
      if (request.user.currentOffer) {
        next(new HttpException(400, 'You Already Have An Active Offer'));
      } else {
        await requestModel
          .findById(offer.requestID)
          .then(async (req: IRequest) => {
            if (req) {
              if (offer.price.from <= offer.price.to) {
                await requestOfferModel
                  .create({
                    helperID: request.user._id,
                    price: offer.price,
                    description: offer.description,
                    requestID: req._id,
                  })
                  .then(async (offerObj: IRequestOffer) => {
                    req.offers.push(offerObj._id);
                    request.user.currentOffer = offerObj._id;
                    await req
                      .save()
                      .then(async (req: IRequest) => {
                        if (req) {
                          await request.user
                            .save()
                            .then((helper: IHelper) => {
                              if (helper) {
                                response
                                  .status(200)
                                  .send(
                                    new Response(
                                      'Submited Offer Successfully'
                                    ).getData()
                                  );
                              } else {
                                next(
                                  new SomethingWentWrongException(
                                    'Couldnt Save'
                                  )
                                );
                              }
                            })
                            .catch((err) => {
                              next(new SomethingWentWrongException(err));
                            });
                        } else {
                          next(
                            new HttpException(
                              400,
                              'Failed To Make Offer, Please try again later.'
                            )
                          );
                        }
                      })
                      .catch((err) => {
                        next(new SomethingWentWrongException(err));
                      });
                  })
                  .catch((err) => {
                    next(new SomethingWentWrongException(err));
                  });
              } else {
                next(
                  new HttpException(
                    400,
                    'From Range Must Be Less Than To Range'
                  )
                );
              }
            } else {
              next(new HttpException(404, 'This Request No Longer Exists'));
            }
          })
          .catch((err) => {
            next(new SomethingWentWrongException(err));
          });
      }
    } else {
      next(new HttpException(401, 'Only Helpers Are Allowed To Make Offers'));
    }
  };
  private async getHelperInformationById(id: string): Promise<object> {
    return new Promise<object>(async (resolve, reject) => {
      await helperModel
        .findById(id)
        .then((helper: IHelper) => {
          if (helper) {
            const helperInfo = {
              profilePicture: helper.profilePicture,
              name: helper.firstName,
              skills: helper.skills,
              category: helper.category,
              mobile: helper.mobile,
            };
            resolve(helperInfo);
          } else {
            resolve(null);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  private viewOffers = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await requestOfferModel
        .find(
          { requestID: request.user.activeRequest },
          '-isAccepted -updatedAt -__v -requestID'
        )
        .then(async (offersArray: IRequestOffer[]) => {
          if (offersArray) {
            let offers = [];
            for (let i = 0; i < offersArray.length; i++) {
              if (!checkOfferTime(offersArray[i])) {
                await requestOfferModel
                  .findByIdAndRemove(offersArray[i]._id)
                  .then(async (requestOffer: IRequestOffer) => {
                    await helperModel
                      .findByIdAndUpdate(requestOffer.helperID, {
                        currentOffer: null,
                      })
                      .then((helper: IHelper) => {
                        offersArray.splice(i, 1);
                      });
                  });
              } else {
                await this.getHelperInformationById(
                  offersArray[i].helperID
                ).then((helperInfo) => {
                  offers.push({
                    helperInfo,
                    offer: offersArray[i],
                  });
                });
              }
            }
            await this.getActiveRequest(request.user).then((req: IRequest) => {
              if (req) {
                response.status(200).send(
                  new Response(undefined, {
                    radius: req.radius,
                    offers,
                  }).getData()
                );
              }
            });
          } else {
            response
              .status(200)
              .send(new Response('Request Has No Offers Yet').getData());
          }
        })
        .catch((err) => {
          next(new SomethingWentWrongException(err));
        });
    } else {
      next(new HttpException(404, 'User Has No Active Request'));
    }
  };
  private viewHistory = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    await requestModel
      .find(
        {
          _id: { $in: request.user.requests },
          $or: [
            { 'finishedState.isFinished': true },
            { 'canceledState.isCanceled': true },
          ],
        },
        '-createdAt -updatedAt -__v -supportTickets -client -offers'
      )
      .then((requests: IRequest[]) => {
        response
          .status(200)
          .send(new Response(undefined, { requests }).getData());
      })
      .catch((err) => {
        next(new SomethingWentWrongException(err));
      });
  };
  private acceptOffer = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const offer: AcceptOfferDTO = request.body;
    await requestOfferModel
      .findByIdAndUpdate(offer.offerID, { isAccepted: true })
      .then(async (offerObj: IRequestOffer) => {
        if (offerObj) {
          await helperModel
            .findByIdAndUpdate(offerObj.helperID, {
              activeRequest: request.user.activeRequest,
              currentOffer: null,
              $push: { requests: request.user.activeRequest },
            })
            .then(async (helper: IHelper) => {
              await requestModel
                .findByIdAndUpdate(request.user.activeRequest, {
                  acceptedState: {
                    acceptedOffer: offer.offerID,
                    helperName: helper.firstName + ' ' + helper.lastName,
                  },
                })
                .then(async (request: IRequest) => {
                  const otherOffers = request.offers.filter(
                    (id) => id !== offer.offerID
                  );
                  for (let i = 0; i < otherOffers.length; i++) {
                    await requestOfferModel
                      .findByIdAndDelete(otherOffers[i])
                      .then(async (deletedOffer) => {
                        await helperModel.findByIdAndUpdate(
                          deletedOffer.helperID,
                          { currentOffer: null }
                        );
                      });
                  }
                  response
                    .status(200)
                    .send(
                      new Response(
                        `Offer Accepted, You Will Be Connected With Your Helper ${helper.firstName} As Soon As Possible`
                      ).getData()
                    );
                })
                .catch((err) => {
                  next(new SomethingWentWrongException(err));
                });
            })
            .catch((err) => {
              next(new SomethingWentWrongException(err));
            });
        } else {
          next(new HttpException(404, 'This Offer No Longer Exists'));
        }
      })
      .catch((err) => {
        next(new SomethingWentWrongException(err));
      });
  };
  private cancelOffer = async (
    request: IRequestWithHelper,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.currentOffer) {
      await requestOfferModel
        .findByIdAndDelete(request.user.currentOffer)
        .then(async (offer: IRequestOffer) => {
          if (offer) {
            await requestModel
              .findByIdAndUpdate(offer.requestID, {
                $pull: { offers: offer._id },
              })
              .then(async (req: IRequest) => {
                request.user.currentOffer = null;
                await request.user
                  .save()
                  .then((helper: IHelper) => {
                    response
                      .status(200)
                      .send(
                        new Response(`Canceled Offer Successfully`).getData()
                      );
                  })
                  .catch((err) => {
                    next(new SomethingWentWrongException(err));
                  });
              })
              .catch((err) => {
                next(new SomethingWentWrongException(err));
              });
          } else {
            next(new HttpException(404, 'You Have No Current Offer'));
          }
        });
    } else {
      next(new HttpException(404, 'You Have No Current Offer'));
    }
  };
}
export default RequestController;
