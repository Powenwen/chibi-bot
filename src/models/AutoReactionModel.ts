import { Schema, model, Document } from "mongoose";

export interface IEmojiReaction {
    emojiID?: string;
    name: string;
    animated: boolean;
    isUnicode: boolean;
    raw: string; // The original emoji string (e.g., "😄" or "<:name:123456789>")
}

export interface IAutoReaction extends Document {
    guildID: string;
    channelID: string;
    emojis: IEmojiReaction[];
    authorID: string;
    createdAt: Date;
    updatedAt: Date;
}

const EmojiReactionSchema = new Schema<IEmojiReaction>({
    emojiID: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    animated: {
        type: Boolean,
        default: false
    },
    isUnicode: {
        type: Boolean,
        required: true
    },
    raw: {
        type: String,
        required: true
    }
}, { _id: false });

const AutoReactionSchema = new Schema<IAutoReaction>({
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
    emojis: {
        type: [EmojiReactionSchema],
        required: true,
        validate: {
            validator: function(emojis: IEmojiReaction[]) {
                return emojis.length > 0 && emojis.length <= 20;
            },
            message: 'Auto reaction must have between 1 and 20 emojis'
        }
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
    }
});

// Add compound index for unique channel per guild
AutoReactionSchema.index({ guildID: 1, channelID: 1 }, { unique: true });

// Update the updatedAt field before saving
AutoReactionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default model<IAutoReaction>("AutoReaction", AutoReactionSchema);