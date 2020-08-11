import * as mongoose from 'mongoose';
import User from './User';
import IHelper from '../../interfaces/user/IHelper';
import GeoSchema from './../GeoSchema';

const Helper = User.discriminator(
  'Helper',
  new mongoose.Schema({
    certificate: [
      {
        type: String,
        required: true,
      },
    ],
    frontID: {
      type: String,
      required: true,
    },
    backID: {
      type: String,
      required: true,
    },
    location: GeoSchema,
    skills: {
      type: String,
      required: true,
    },
    adminApproved: {
      type: Boolean,
      default: false,
    },
    category: {
      ref: 'Category',
      type: String,
    },
    currentOffer: {
      ref: 'RequestOffer',
      type: mongoose.Schema.Types.ObjectId,
    },
  })
);

const helperModel = mongoose.model<IHelper>('Helper');

export default helperModel;
