import mongoose, { Schema, model, Types } from "mongoose";
import { IPost } from "../interfaces";

const Post = new Schema({
    author: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    private: {
        type: Boolean,
        required: false,
        default: false 
    },
    category: {
        type: String,
        required: true,
        default: "general"
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    comments: [{
        author: {
            type: Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: true
        }

    }]
}, {
    timestamps: true
});


export default model<IPost & mongoose.Document>("Post", Post);