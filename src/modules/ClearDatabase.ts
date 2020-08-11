import conversationModel from './../models/request/Conversation';
import requestModel from './../models/request/Request';
import requestOfferModel from './../models/request/RequestOffer';
import supportTicketModel from './../models/request/SupportTicket';
import adminModel from './../models/user/Admin';
import clientModel from './../models/user/Client';
import helperModel from './../models/user/Helper';
import userModel from './../models/user/User';

export default async function clearDatabase() {
  await conversationModel.deleteMany({});
  await requestModel.deleteMany({});
  await requestOfferModel.deleteMany({});
  await supportTicketModel.deleteMany({});
  await adminModel.deleteMany({});
  await clientModel.deleteMany({});
  await helperModel.deleteMany({});
  await userModel.deleteMany({});
}
