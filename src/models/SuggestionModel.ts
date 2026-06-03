import { Schema, model, Document } from "mongoose";

export type SuggestionStatus = "Pending" | "Approved" | "Denied" | "Implemented" | "Considered";
export type SuggestionPriority = "low" | "medium" | "high" | "critical";

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
    // New fields
    category: string;
    anonymous: boolean;
    priority: SuggestionPriority;
    attachmentUrl: string;
    notes: string;
    // Vote tracking
    upvotes: string[];
    downvotes: string[];
    // Implementation tracking
    implementedAt: Date;
    implementedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>({
    guildID: {
        type: String,
        required: true,
        index: true
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
        required: true,
        maxlength: 4000
    },
    authorID: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Denied", "Implemented", "Considered"],
        default: "Pending"
    },
    response: {
        type: String,
        default: "",
        maxlength: 2000
    },
    responseAuthorID: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: "General",
        maxlength: 50
    },
    anonymous: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium"
    },
    attachmentUrl: {
        type: String,
        default: ""
    },
    notes: {
        type: String,
        default: "",
        maxlength: 1000
    },
    upvotes: {
        type: [String],
        default: []
    },
    downvotes: {
        type: [String],
        default: []
    },
    implementedAt: {
        type: Date,
        default: null
    },
    implementedBy: {
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

SuggestionSchema.index({ guildID: 1, status: 1 });
SuggestionSchema.index({ guildID: 1, category: 1 });
SuggestionSchema.index({ guildID: 1, createdAt: -1 });

SuggestionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default model<ISuggestion>("Suggestion", SuggestionSchema);