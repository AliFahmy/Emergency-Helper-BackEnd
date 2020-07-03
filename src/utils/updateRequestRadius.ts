import requestModel from './../models/request/Request';
import IRequest from './../interfaces/request/IRequest';
const EARTH_IN_KM = 6371;
export const updateRequestsRadius = async () => {
  await requestModel
    .find({
      'canceledState.isCanceled': { $ne: true },
      'finishedState.isFinished': { $ne: true },
      'acceptedState.isAccepted': { $ne: true },
    })
    .then(async (requests: IRequest[]) => {
      for (let i = 0; i < requests.length; i++) {
        if (requests[i].radius < EARTH_IN_KM) {
          requests[i].radius++;
          await requests[i].save();
        }
      }
    })
    .catch((err) => {
      console.log('Error Updating Request Radius');
    });
};
