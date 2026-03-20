import { Schema, model, Document } from "mongoose";

export interface IStickyMessage extends Document {
    guildID: string;
    channelID: string;
    messageID: string;
    messageChannelID: string;
    uniqueID: string;
    authorID: string;
    createdAt: Date;
    title: string;
    content: string;
    color: string;
    embedID: string;
    maxMessageCount: number;
}

const StickyMessageSchema = new Schema<IStickyMessage>({
    guildID: {
        type: String,
        required: true
    },
    channelID: {
        type: String,
        required: true
    },
    messageID: {
        type: String,
        required: true
    },
    messageChannelID: {
        type: String,
        required: true
    },
    uniqueID: {
        type: String,
        required: true,
        unique: true
    },
    authorID: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    title: {
        type: String,
        default: ""
    },
    content: {
        type: String,
        default: ""
    },
    color: {
        type: String,
        default: "#0099ff"
    },
    embedID: {
        type: String,
        default: ""
    },
    maxMessageCount: {
        type: Number,
        default: 0
    }
});

export default model<IStickyMessage>("StickyMessage", StickyMessageSchema);