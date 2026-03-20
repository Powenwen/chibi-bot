import { Schema, model, Document } from "mongoose";

export interface ISuggestionChannel extends Document {
    guildID: string;
    channelID: string;
    emojis: {
        upvote: string;
        downvote: string;
    };
    createdAt?: Date;
}

const SuggestionChannelSchema = new Schema<ISuggestionChannel>({
    guildID: {
        type: String,
        required: true
    },
    channelID: {
        type: String,
        required: true
    },
    emojis: {
        upvote: {
            type: String,
            required: true,
            default: "👍"
        },
        downvote: {
            type: String,
            required: true,
            default: "👎"
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default model<ISuggestionChannel>("SuggestionChannel", SuggestionChannelSchema);