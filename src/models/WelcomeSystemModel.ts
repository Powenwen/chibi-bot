import { Schema, model, Document } from "mongoose";

export interface IWelcomeSystem extends Document {
    guildID: string;
    channelID: string;
    embed: {
        title: string;
        description: string;
        color: string;
        thumbnail: boolean;
        footer: {
            enabled: boolean;
            text: string;
            timestamp: boolean;
        };
    };
    enabled?: boolean;
    createdAt?: Date;
}

const WelcomeSystemSchema = new Schema<IWelcomeSystem>({
    guildID: {
        type: String,
        required: true
    },
    channelID: {
        type: String,
        required: true
    },
    embed: {
        title: {
            type: String,
            required: true,
            default: "Welcome to {server}!"
        },
        description: {
            type: String,
            required: true,
            default: "Welcome {user} to our amazing server! You are member #{memberCount}."
        },
        color: {
            type: String,
            default: "#0099ff"
        },
        thumbnail: {
            type: Boolean,
            default: true
        },
        footer: {
            enabled: {
                type: Boolean,
                default: true
            },
            text: {
                type: String,
                default: "Welcome System"
            },
            timestamp: {
                type: Boolean,
                default: true
            }
        }
    },
    enabled: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default model<IWelcomeSystem>("WelcomeSystem", WelcomeSystemSchema);