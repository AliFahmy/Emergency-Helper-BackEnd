import * as mongoose from 'mongoose';
import IConversation from '../../interfaces/IConversation';

const baseOptions = {
    timestamps: true
};

const conversationSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    request: {
        ref: 'Request',
        type: mongoose.Schema.Types.ObjectId
    },
    messages: [{
        senderID: {
            ref: 'User',
            type: mongoose.Types.ObjectId
        },
        senderName: {
            type: String
        },
        message: {
            type: String
        },
        senderRole: {
            type: String
        },
        date: {
            type: Date
        }
    }]
}, baseOptions)

const conversationModel = mongoose.model<IConversation>('Conversation', conversationSchema);

export default conversationModel;