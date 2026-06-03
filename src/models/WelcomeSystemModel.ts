import { Schema, model, Document } from "mongoose";

export interface IWelcomeField {
    name: string;
    value: string;
    inline: boolean;
}

export interface IWelcomeSystem extends Document {
    guildID: string;
    channelID: string;
    enabled: boolean;
    embed: {
        title: string;
        description: string;
        color: string;
        thumbnail: boolean;
        thumbnailUrl: string;
        image: boolean;
        imageUrl: string;
        author: {
            enabled: boolean;
            name: string;
            iconUrl: string;
            url: string;
        };
        footer: {
            enabled: boolean;
            text: string;
            iconUrl: string;
            timestamp: boolean;
        };
        fields: IWelcomeField[];
        timestamp: boolean;
    };
    dmEnabled: boolean;
    dmMessage: string;
    roleEnabled: boolean;
    roleIDs: string[];
    type: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}

const WelcomeFieldSchema = new Schema<IWelcomeField>({
    name: { type: String, required: true },
    value: { type: String, required: true },
    inline: { type: Boolean, default: false }
}, { _id: false });

const WelcomeSystemSchema = new Schema<IWelcomeSystem>({
    guildID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    channelID: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    embed: {
        title: {
            type: String,
            required: true,
            default: "Welcome to {server}!",
            maxlength: 256
        },
        description: {
            type: String,
            required: true,
            default: "Welcome {user} to our amazing server! You are member #{memberCount}.",
            maxlength: 4096
        },
        color: {
            type: String,
            default: "#5865F2"
        },
        thumbnail: {
            type: Boolean,
            default: true
        },
        thumbnailUrl: {
            type: String,
            default: ""
        },
        image: {
            type: Boolean,
            default: false
        },
        imageUrl: {
            type: String,
            default: ""
        },
        author: {
            enabled: { type: Boolean, default: false },
            name: { type: String, default: "", maxlength: 256 },
            iconUrl: { type: String, default: "" },
            url: { type: String, default: "" }
        },
        footer: {
            enabled: { type: Boolean, default: true },
            text: { type: String, default: "Welcome System", maxlength: 2048 },
            iconUrl: { type: String, default: "" },
            timestamp: { type: Boolean, default: true }
        },
        fields: {
            type: [WelcomeFieldSchema],
            default: [],
            validate: {
                validator: (fields: IWelcomeField[]) => fields.length <= 25,
                message: "Maximum 25 embed fields allowed"
            }
        },
        timestamp: {
            type: Boolean,
            default: false
        }
    },
    dmEnabled: {
        type: Boolean,
        default: false
    },
    dmMessage: {
        type: String,
        default: "Welcome to {server}! We're glad to have you here.",
        maxlength: 2000
    },
    roleEnabled: {
        type: Boolean,
        default: false
    },
    roleIDs: {
        type: [String],
        default: []
    },
    type: {
        type: String,
        enum: ["embed", "text", "both"],
        default: "embed"
    },
    message: {
        type: String,
        default: "Welcome {user} to {server}!",
        maxlength: 2000
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

WelcomeSystemSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default model<IWelcomeSystem>("WelcomeSystem", WelcomeSystemSchema);