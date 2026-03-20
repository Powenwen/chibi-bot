import { Schema, model, Document } from "mongoose";

export interface IAutoResponder extends Document {
    guildID: string;
    channelID: string;
    trigger: string;
    response: string;
    authorID: string;
    caseSensitive: boolean;
    exactMatch: boolean;
    useEmbed: boolean;
    embedTitle?: string;
    embedColor?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AutoResponderSchema = new Schema<IAutoResponder>({
    guildID: {
        type: String,
        required: true,
        index: true
    },
    channelID: {
        type: String,
        required: true,
        index: true
    },
    trigger: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    authorID: {
        type: String,
        required: true
    },
    caseSensitive: {
        type: Boolean,
        default: false
    },
    exactMatch: {
        type: Boolean,
        default: false
    },
    useEmbed: {
        type: Boolean,
        default: false
    },
    embedTitle: {
        type: String,
        required: false
    },
    embedColor: {
        type: String,
        required: false,
        default: "#5865F2" // Discord Blurple
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

// Add compound index for unique trigger per channel
AutoResponderSchema.index({ guildID: 1, channelID: 1, trigger: 1 }, { unique: true });

// Update the updatedAt field before saving
AutoResponderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default model<IAutoResponder>("AutoResponder", AutoResponderSchema);
