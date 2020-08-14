import * as express from 'express';
/////////////////////////////////////////
import validationMiddleware from '../middlewares/validation';
import authMiddleware from '../middlewares/auth';
/////////////////////////////////////////
import IController from '../interfaces/IController';
import IUser from '../interfaces/user/IUser';
import IRequest from '../interfaces/request/IRequest';
import IRequestWithUser from '../interfaces/httpRequest/IRequestWithUser';
import IConversation from '../interfaces/IConversation';
/////////////////////////////////////////
import requestModel from '../models/request/Request';
import conversationModel from '../models/request/Conversation';
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
import IOffer from './../interfaces/request/IOffer';
import clientModel from './../models/user/Client';
import IClient from './../interfaces/user/IClient';
import IRequestWithClient from './../interfaces/httpRequest/IRequestWithClient';
import IRate from './../interfaces/request/IRate';
import RateRequestDTO from './../dto/requestDTO/RateRequestDTO';
import { arePointsNear } from './../modules/DistanceBetweenTwoPoints';

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
    this.router.post(`${this.path}/StartHelp`, authMiddleware, this.startHelp);
    this.router.post(
      `${this.path}/RateRequest`,
      authMiddleware,
      validationMiddleware(RateRequestDTO, true),
      this.rateRequest
    );
    this.router.post(
      `${this.path}/ConfirmHelpStart`,
      authMiddleware,
      this.confirmHelpStart
    );
    this.router.post(
      `${this.path}/ConfirmPayment`,
      authMiddleware,
      this.confirmPayment
    );
    this.router.post(
      `${this.path}/RestartRequest`,
      authMiddleware,
      this.restartRequest
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
      `${this.path}/RequestReceipt`,
      authMiddleware,
      this.requestReceipt
    );
    this.router.get(
      `${this.path}/RequestInfo`,
      authMiddleware,
      this.requestInfo
    );
    this.router.get(
      `${this.path}/AcceptedOffer`,
      authMiddleware,
      this.getAcceptedOffer
    );
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
  private restartRequest = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await requestModel
        .findById(request.user.activeRequest)
        .then(async (req: IRequest) => {
          if (req.acceptedState.acceptedOffer) {
            await requestOfferModel
              .findByIdAndDelete(req.acceptedState.acceptedOffer)
              .then(async (offer: IRequestOffer) => {
                await helperModel
                  .findByIdAndUpdate(offer.helperID, {
                    $unset: { currentOffer: 1, activeRequest: 1 },
                  })
                  .then(async (helper: IHelper) => {
                    await requestModel
                      .findByIdAndUpdate(req._id, {
                        $unset: {
                          canceledState: 1,
                          offers: 1,
                          acceptedState: 1,
                          finishedState: 1,
                          conversation: 1,
                        },
                      })
                      .then((updatedRequest: IRequest) => {
                        response
                          .status(200)
                          .send(new Response('Request Restarted').getData());
                      })
                      .catch((err) => {
                        next(new SomethingWentWrongException(err));
                      });
                  })
                  .catch((err) => {
                    next(new SomethingWentWrongException());
                  });
              })
              .catch((err) => {
                next(new SomethingWentWrongException());
              });
          }
        })
        .catch((err) => {
          next(new SomethingWentWrongException());
        });
    } else {
      next(new HttpException(404, 'You Dont Have Active Request'));
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
        '-createdAt -updatedAt -__v -supportTickets -client -offers -location'
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
  private async getHelperInformationById(id: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await helperModel
        .findById(id)
        .then((helper: IHelper) => {
          if (helper) {
            const helperInfo = {
              profilePicture: helper.profilePicture,
              name: helper.firstName,
              skills: helper.skills,
              category: helper.category,
              location: helper.location,
              mobile: helper.mobile,
              rate: helper.rate.totalRate / helper.rate.numberOfReviews,
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
  private removeExpiredOffers = async (
    requestId: string
  ): Promise<string[]> => {
    return new Promise<string[]>(async (resolve, reject) => {
      await requestOfferModel
        .find(
          { requestID: requestId },
          '-isAccepted -updatedAt -__v -requestID'
        )
        .then(async (offersArray: IRequestOffer[]) => {
          let removedOffers = [];
          let pendingOffers = [];
          for (let i = 0; i < offersArray.length; i++) {
            if (!checkOfferTime(offersArray[i]) && !offersArray[i].isAccepted) {
              removedOffers.push(offersArray[i]._id);
              await helperModel.findByIdAndUpdate(offersArray[i].helperID, {
                $unset: { currentOffer: 1 },
              });
            } else {
              pendingOffers.push(offersArray[i]._id);
            }
          }
          await requestOfferModel
            .deleteMany({ _id: { $in: removedOffers } })
            .then(async () => {
              await requestModel
                .findByIdAndUpdate(requestId, {
                  offers: pendingOffers,
                })
                .then((request: IRequest) => {
                  resolve(request.offers);
                });
            });
        })
        .catch((err) => {
          reject([]);
        });
    });
  };
  private viewOffers = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await this.removeExpiredOffers(request.user.activeRequest).then(
        async (pendingOffers: string[]) => {
          await requestOfferModel
            .find({ _id: { $in: pendingOffers } }, '-__v -createdAt -updatedAt')
            .then(async (offersArray: IRequestOffer[]) => {
              await this.getActiveRequest(request.user).then(
                async (req: IRequest) => {
                  const offers = [];
                  for (let i = 0; i < offersArray.length; i++) {
                    await this.getHelperInformationById(
                      offersArray[i].helperID
                    ).then((helperInfo) => {
                      offers.push({
                        helperInfo,
                        offer: offersArray[i].toObject(),
                        distanceBetween: parseFloat(
                          arePointsNear(
                            helperInfo.location,
                            req.location
                          ).toFixed(1)
                        ),
                      });
                    });
                  }
                  response.status(200).send(
                    new Response(undefined, {
                      radius: req.radius,
                      offers,
                    }).getData()
                  );
                }
              );
            })
            .catch((err) => {
              next(new SomethingWentWrongException(err));
            });
        }
      );
    } else {
      next(new HttpException(404, 'User Has No Active Request'));
    }
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
                .then(async (req: IRequest) => {
                  const otherOffers = req.offers.filter(
                    (id) => id != offer.offerID
                  );
                  for (let i = 0; i < otherOffers.length; i++) {
                    await requestOfferModel
                      .findByIdAndDelete(otherOffers[i])
                      .then(async (deletedOffer) => {
                        await helperModel.findByIdAndUpdate(
                          deletedOffer.helperID,
                          { $unset: { currentOffer: 1 } }
                        );
                      });
                  }
                  await conversationModel
                    .create({
                      requestID: request.user._id,
                      date: new Date(),
                      messages: [],
                    })
                    .then(async (conversation: IConversation) => {
                      req.conversation = conversation._id;
                    });
                  req.offers = [offer.offerID];
                  await req.save().then(() => {
                    response
                      .status(200)
                      .send(
                        new Response(
                          `Offer Accepted, You Will Be Connected With Your Helper ${helper.firstName} As Soon As Possible`
                        ).getData()
                      );
                  });
                })
                .catch((err) => {
                  next(new SomethingWentWrongException(err));
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
        console.log('awl error');
        next(new SomethingWentWrongException(err));
      });
  };
  private requestReceipt = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await requestModel
        .findById(request.user.activeRequest)
        .then((req: IRequest) => {
          if (req.finishedState.isFinished) {
            response.status(200).send(
              new Response(undefined, {
                items: req.finishedState.items,
                totalPrice: req.finishedState.totalPrice,
              }).getData()
            );
          } else {
            next(new HttpException(400, 'Request Is Not Finished Yet'));
          }
        })
        .catch((err) => {
          next(new SomethingWentWrongException());
        });
    } else {
      next(new HttpException(404, 'You Have No Active Request'));
    }
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
                await helperModel
                  .findByIdAndUpdate(request.user._id, {
                    $unset: { currentOffer: 1 },
                  })
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
  private requestInfo = async (
    request: IRequestWithHelper,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await requestModel
        .findById(request.user.activeRequest)
        .then(async (req: IRequest) => {
          await requestOfferModel
            .findById(req.acceptedState.acceptedOffer)
            .then(async (acceptedOffer: IOffer) => {
              if (acceptedOffer.isAccepted) {
                await clientModel
                  .findById(req.client)
                  .then((client: IClient) => {
                    response.status(200).send(
                      new Response(undefined, {
                        clientImage: client.profilePicture,
                        clientName: {
                          firstName: client.firstName,
                          lastName: client.lastName,
                        },
                        clientNumber: client.mobile,
                        requestLocation: {
                          longitude: req.location.coordinates[0],
                          latitude: req.location.coordinates[1],
                        },
                        priceRange: acceptedOffer.price,
                        offerDescription: acceptedOffer.description,
                        requestDescription: req.description,
                      }).getData()
                    );
                  })
                  .catch((err) => {
                    next(new SomethingWentWrongException(err));
                  });
              } else {
                next(new HttpException(404, 'Your Offer Is Not Yet Accepted'));
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
      next(new HttpException(404, 'You Have No Accepted Offer'));
    }
  };
  private getAcceptedOffer = async (
    request: IRequestWithHelper,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await requestModel
        .findById(request.user.activeRequest)
        .then(async (req: IRequest) => {
          await requestOfferModel
            .findById(req.acceptedState.acceptedOffer)
            .then(async (acceptedOffer: IOffer) => {
              if (acceptedOffer.isAccepted) {
                await helperModel
                  .findById(acceptedOffer.helperID)
                  .then((helper: IHelper) => {
                    response.status(200).send(
                      new Response(undefined, {
                        helperImage: helper.profilePicture,
                        helperName: {
                          firstName: helper.firstName,
                          lastName: helper.lastName,
                        },
                        helperNumber: helper.mobile,
                        priceRange: acceptedOffer.price,
                        skills: helper.skills,
                        offerDescription: acceptedOffer.description,
                        category: helper.category,
                        requestID: req._id,
                      }).getData()
                    );
                  })
                  .catch((err) => {
                    console.log('helper model');
                    next(new SomethingWentWrongException(err));
                  });
              } else {
                next(new HttpException(404, 'Your Offer Is Not Yet Accepted'));
              }
            })
            .catch((err) => {
              console.log('request offer model');
              next(new SomethingWentWrongException(err));
            });
        })
        .catch((err) => {
          console.log('request model');
          next(new SomethingWentWrongException(err));
        });
    } else {
      next(new HttpException(404, 'You Have No Accepted Offer'));
    }
  };
  private startHelp = async (
    request: IRequestWithHelper,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await requestModel
        .findByIdAndUpdate(request.user.activeRequest, {
          'acceptedState.helperStarted': true,
        })
        .then((req: IRequest) => {
          response
            .status(200)
            .send(
              new Response(
                'Help Started, Please Wait For Client To Approve Your Start'
              ).getData()
            );
        })
        .catch((err) => {
          next(new SomethingWentWrongException(err));
        });
    } else {
      next(new HttpException(404, 'You Have No Active Request To Start'));
    }
  };
  private confirmHelpStart = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await requestModel
        .findByIdAndUpdate(request.user.activeRequest, {
          'acceptedState.clientApproved': true,
        })
        .then((req: IRequest) => {
          response
            .status(200)
            .send(
              new Response(
                'Helper Start Confirmed, Please Wait For Your Helper '
              ).getData()
            );
        })
        .catch((err) => {
          next(new SomethingWentWrongException(err));
        });
    } else {
      next(new HttpException(404, 'You Have No Active Request'));
    }
  };
  private confirmPayment = async (
    request: IRequestWithClient,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (request.user.activeRequest) {
      await clientModel
        .findByIdAndUpdate(request.user, {
          $unset: { activeRequest: 1 },
        })
        .then((client: IClient) => {
          response
            .status(200)
            .send(
              new Response(
                'Payment Confirmed, Your Request Is Now Finished'
              ).getData()
            );
        })
        .catch((err) => {
          next(new SomethingWentWrongException());
        });
    } else {
      next(new HttpException(404, 'You Have No Active Request'));
    }
  };
  private rateRequest = async (
    request: IRequestWithUser,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const rate: RateRequestDTO = request.body;
    const requestID: string = rate.requestID
      ? rate.requestID
      : request.user.activeRequest;
    if (requestID) {
      await this.rateRequestHelperFunction(request.user.role, rate, requestID)
        .then((result: boolean) => {
          if (result) {
            response
              .status(200)
              .send(new Response('Request Rated Successfully').getData());
          }
        })
        .catch((reason: boolean) => {
          next(new SomethingWentWrongException());
        });
    } else {
      next(new HttpException(404, 'You Have No Active Request To Rate'));
    }
  };
  private rateRequestHelperFunction = async (
    userRole: string,
    rate: IRate,
    requestID: string
  ): Promise<boolean> => {
    return new Promise<boolean>(async (resolve, reject) => {
      if (userRole == 'Client') {
        await requestModel
          .findByIdAndUpdate(requestID, {
            'finishedState.clientRate': {
              rate: rate.rate,
              feedback: rate.feedback,
            },
          })
          .then(async (request: IRequest) => {
            await requestOfferModel
              .findById(request.acceptedState.acceptedOffer)
              .then(async (requestOffer: IRequestOffer) => {
                await helperModel
                  .findById(requestOffer.helperID)
                  .then((helper: IHelper) => {
                    helper.rate.numberOfReviews += 1;
                    helper.rate.totalRate += rate.rate;
                    resolve(true);
                    return;
                  })
                  .catch((err) => {
                    reject(false);
                  });
              })
              .catch((err) => {
                reject(false);
              });
          });
      } else if (userRole == 'Helper') {
        await requestModel
          .findByIdAndUpdate(requestID, {
            'finishedState.helperRate': {
              rate: rate.rate,
              feedback: rate.feedback,
            },
          })
          .then(async (request: IRequest) => {
            await clientModel
              .findById(request.client)
              .then(async (client: IClient) => {
                client.rate.numberOfReviews += 1;
                client.rate.totalRate += rate.rate;
                await client
                  .save()
                  .then(() => {
                    resolve(true);
                    return;
                  })
                  .catch((err) => {
                    reject(false);
                  });
              });
          });
      }
      reject(false);
    });
  };
}
export default RequestController;
