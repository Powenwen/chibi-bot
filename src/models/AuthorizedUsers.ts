import { Schema, model, Document } from "mongoose";

export interface IAuthorizedUser extends Document {
    userId: string;
    username?: string;
    role?: string;
    addedAt?: Date;
    addedBy?: string;
}

const AuthorizedUsersSchema = new Schema<IAuthorizedUser>({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: false
    },
    role: {
        type: String,
        required: false,
        default: "user"
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    addedBy: {
        type: String,
        required: false
    }
});

export default model<IAuthorizedUser>("AuthorizedUsers", AuthorizedUsersSchema);