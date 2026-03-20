import { Schema, model, Document } from "mongoose";

export interface IModerationLog extends Document {
    guildID: string;
    channelID?: string; // Moderation log channel
    auditLog: {
        enabled: boolean;
        channelID?: string;
        events: string[]; // messageDelete, messageEdit, memberJoin, etc.
    };
    autoModLog: {
        enabled: boolean;
        channelID?: string;
    };
    joinLeaveLog: {
        enabled: boolean;
        channelID?: string;
    };
}

const ModerationLogSchema = new Schema<IModerationLog>({
    guildID: {
        type: String,
        required: true,
        unique: true
    },
    channelID: {
        type: String,
        required: false
    },
    auditLog: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, required: false },
        events: [{ type: String }]
    },
    autoModLog: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, required: false }
    },
    joinLeaveLog: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, required: false }
    }
});

export default model<IModerationLog>("ModerationLog", ModerationLogSchema);
