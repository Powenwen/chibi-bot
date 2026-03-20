import { Schema, model, Document } from "mongoose";

export interface IModerationCase extends Document {
    caseID: string;
    guildID: string;
    userID: string;
    moderatorID: string;
    type: "warn" | "mute" | "kick" | "ban" | "unban" | "timeout";
    reason: string;
    duration?: number; // in milliseconds for temporary actions
    active: boolean;
    createdAt: Date;
    expiresAt?: Date;
    evidence?: string[]; // URLs to screenshots, etc.
}

const ModerationCaseSchema = new Schema<IModerationCase>({
    caseID: {
        type: String,
        required: true,
        unique: true
    },
    guildID: {
        type: String,
        required: true,
        index: true
    },
    userID: {
        type: String,
        required: true,
        index: true
    },
    moderatorID: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["warn", "mute", "kick", "ban", "unban", "timeout"],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: false
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: false
    },
    evidence: [{
        type: String
    }]
});

// Compound index for efficient queries
ModerationCaseSchema.index({ guildID: 1, userID: 1 });
ModerationCaseSchema.index({ guildID: 1, type: 1 });

export default model<IModerationCase>("ModerationCase", ModerationCaseSchema);
