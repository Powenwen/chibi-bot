import { Schema, model, Document } from "mongoose";
import { SuggestionStatus } from "../shared/types";

export interface ISuggestion extends Document {
    guildID: string;
    channelID: string;
    messageID: string;
    suggestionID: string;
    suggestion: string;
    authorID: string;
    status: SuggestionStatus;
    response: string;
    responseAuthorID: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const SuggestionSchema = new Schema<ISuggestion>({
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
    suggestionID: {
        type: String,
        required: true,
        unique: true
    },
    suggestion: {
        type: String,
        required: true
    },
    authorID: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Denied"],
        default: "Pending"
    },
    response: {
        type: String,
        default: ""
    },
    responseAuthorID: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default model<ISuggestion>("Suggestion", SuggestionSchema);