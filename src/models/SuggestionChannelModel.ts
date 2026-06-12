import { Schema, model, Document } from "mongoose";

export interface ISuggestionChannel extends Document {
    guildID: string;
    channelID: string;
    enabled: boolean;
    emojis: {
        upvote: string;
        downvote: string;
    };
    // Categories
    categories: string[];
    defaultCategory: string;
    // Cooldown (seconds between suggestions per user)
    cooldown: number;
    // Role restrictions
    requiredRoleID: string;
    blockedRoleID: string;
    // Thread settings
    autoThread: boolean;
    // Limits
    maxSuggestionsPerUser: number;
    // Notifications
    notifyRoleID: string;
    dmOnResponse: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SuggestionChannelSchema = new Schema<ISuggestionChannel>({
    guildID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    channelID: {
        type: String,
        default: ''
    },
    enabled: {
        type: Boolean,
        default: true
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
    categories: {
        type: [String],
        default: ["General", "Features", "Bug Reports", "Other"]
    },
    defaultCategory: {
        type: String,
        default: "General"
    },
    cooldown: {
        type: Number,
        default: 0,
        min: 0,
        max: 86400
    },
    requiredRoleID: {
        type: String,
        default: ""
    },
    blockedRoleID: {
        type: String,
        default: ""
    },
    autoThread: {
        type: Boolean,
        default: false
    },
    maxSuggestionsPerUser: {
        type: Number,
        default: 0,
        min: 0
    },
    notifyRoleID: {
        type: String,
        default: ""
    },
    dmOnResponse: {
        type: Boolean,
        default: true
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

SuggestionChannelSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default model<ISuggestionChannel>("SuggestionChannel", SuggestionChannelSchema);