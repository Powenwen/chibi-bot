import { Schema, model, Document } from "mongoose";

export interface IWarningEscalation extends Document {
    guildID: string;
    escalationRules: EscalationRule[];
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface EscalationRule {
    warningCount: number;
    action: "timeout" | "mute" | "kick" | "ban";
    duration?: number; // in milliseconds for timeout/mute
    reason: string;
    deleteMessages?: number; // for bans, number of days to delete messages
}

const EscalationRuleSchema = new Schema<EscalationRule>({
    warningCount: {
        type: Number,
        required: true,
        min: 1
    },
    action: {
        type: String,
        enum: ["timeout", "mute", "kick", "ban"],
        required: true
    },
    duration: {
        type: Number,
        required: false,
        min: 1000 // Minimum 1 second
    },
    reason: {
        type: String,
        required: true,
        default: "Automatic escalation"
    },
    deleteMessages: {
        type: Number,
        required: false,
        min: 0,
        max: 7
    }
}, { _id: false });

const WarningEscalationSchema = new Schema<IWarningEscalation>({
    guildID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    escalationRules: {
        type: [EscalationRuleSchema],
        default: []
    },
    enabled: {
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

// Update the updatedAt field before saving
WarningEscalationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default model<IWarningEscalation>("WarningEscalation", WarningEscalationSchema);