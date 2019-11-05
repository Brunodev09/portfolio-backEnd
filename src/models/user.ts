import mongoose, { Schema, model } from "mongoose";
import { IUser } from "../interfaces";

const User = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: false,
    },
    dev: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true
});

export default model<IUser & mongoose.Document>("User", User);