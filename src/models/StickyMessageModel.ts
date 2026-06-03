import { Schema, model, Document } from "mongoose";

export interface IStickyField {
    name: string;
    value: string;
    inline: boolean;
}

export interface IStickyMessage extends Document {
    guildID: string;
    channelID: string;
    messageID: string;
    messageChannelID: string;
    uniqueID: string;
    authorID: string;
    createdAt: Date;
    updatedAt: Date;
    // Embed content
    title: string;
    content: string;
    color: string;
    // Rich embed options
    description: string;
    thumbnailUrl: string;
    imageUrl: string;
    footer: {
        text: string;
        iconUrl: string;
    };
    author: {
        name: string;
        iconUrl: string;
        url: string;
    };
    fields: IStickyField[];
    timestamp: boolean;
    // Behavior
    embedID: string;
    maxMessageCount: number;
    mode: "message-count" | "interval" | "persistent";
    intervalSeconds: number;
    enabled: boolean;
    // Role to ping on repost
    mentionRoleID: string;
}

const StickyFieldSchema = new Schema<IStickyField>({
    name: { type: String, required: true, maxlength: 256 },
    value: { type: String, required: true, maxlength: 1024 },
    inline: { type: Boolean, default: false }
}, { _id: false });

const StickyMessageSchema = new Schema<IStickyMessage>({
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
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        default: "",
        maxlength: 256
    },
    content: {
        type: String,
        default: "",
        maxlength: 4096
    },
    color: {
        type: String,
        default: "#5865F2"
    },
    description: {
        type: String,
        default: "",
        maxlength: 4096
    },
    thumbnailUrl: {
        type: String,
        default: ""
    },
    imageUrl: {
        type: String,
        default: ""
    },
    footer: {
        text: { type: String, default: "", maxlength: 2048 },
        iconUrl: { type: String, default: "" }
    },
    author: {
        name: { type: String, default: "", maxlength: 256 },
        iconUrl: { type: String, default: "" },
        url: { type: String, default: "" }
    },
    fields: {
        type: [StickyFieldSchema],
        default: [],
        validate: {
            validator: (fields: IStickyField[]) => fields.length <= 25,
            message: "Maximum 25 embed fields allowed"
        }
    },
    timestamp: {
        type: Boolean,
        default: false
    },
    embedID: {
        type: String,
        default: ""
    },
    maxMessageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    mode: {
        type: String,
        enum: ["message-count", "interval", "persistent"],
        default: "message-count"
    },
    intervalSeconds: {
        type: Number,
        default: 0,
        min: 0
    },
    enabled: {
        type: Boolean,
        default: true
    },
    mentionRoleID: {
        type: String,
        default: ""
    }
});

StickyMessageSchema.index({ guildID: 1, channelID: 1 });
StickyMessageSchema.index({ guildID: 1, enabled: 1 });

StickyMessageSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default model<IStickyMessage>("StickyMessage", StickyMessageSchema);