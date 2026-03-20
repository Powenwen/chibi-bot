import { Schema, model, Document } from "mongoose";

export interface IAutoModeration extends Document {
    guildID: string;
    enabled: boolean;
    antiSpam: {
        enabled: boolean;
        maxMessages: number;
        timeWindow: number; // in seconds
        muteTime: number; // in minutes
        ignoreRoles: string[];
        ignoreChannels: string[];
    };
    wordFilter: {
        enabled: boolean;
        words: string[];
        action: "delete" | "warn" | "mute" | "kick";
        whitelist: string[];
    };
    linkFilter: {
        enabled: boolean;
        allowedDomains: string[];
        action: "delete" | "warn" | "mute";
        bypassRoles: string[];
    };
    raidProtection: {
        enabled: boolean;
        joinThreshold: number;
        timeWindow: number; // in seconds
        action: "kick" | "ban";
        lockdownTime: number; // in minutes
    };
    duplicateFilter: {
        enabled: boolean;
        maxDuplicates: number;
        timeWindow: number; // in seconds
        action: "delete" | "warn" | "mute";
    };
    caps: {
        enabled: boolean;
        percentage: number;
        minLength: number;
        action: "delete" | "warn";
    };
}

const AutoModerationSchema = new Schema<IAutoModeration>({
    guildID: {
        type: String,
        required: true,
        unique: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    antiSpam: {
        enabled: { type: Boolean, default: true },
        maxMessages: { type: Number, default: 5 },
        timeWindow: { type: Number, default: 10 },
        muteTime: { type: Number, default: 5 },
        ignoreRoles: [{ type: String }],
        ignoreChannels: [{ type: String }]
    },
    wordFilter: {
        enabled: { type: Boolean, default: false },
        words: [{ type: String }],
        action: { type: String, enum: ["delete", "warn", "mute", "kick"], default: "delete" },
        whitelist: [{ type: String }]
    },
    linkFilter: {
        enabled: { type: Boolean, default: false },
        allowedDomains: [{ type: String }],
        action: { type: String, enum: ["delete", "warn", "mute"], default: "delete" },
        bypassRoles: [{ type: String }]
    },
    raidProtection: {
        enabled: { type: Boolean, default: true },
        joinThreshold: { type: Number, default: 5 },
        timeWindow: { type: Number, default: 60 },
        action: { type: String, enum: ["kick", "ban"], default: "kick" },
        lockdownTime: { type: Number, default: 10 }
    },
    duplicateFilter: {
        enabled: { type: Boolean, default: true },
        maxDuplicates: { type: Number, default: 3 },
        timeWindow: { type: Number, default: 30 },
        action: { type: String, enum: ["delete", "warn", "mute"], default: "delete" }
    },
    caps: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 70 },
        minLength: { type: Number, default: 6 },
        action: { type: String, enum: ["delete", "warn"], default: "delete" }
    }
});

export default model<IAutoModeration>("AutoModeration", AutoModerationSchema);
