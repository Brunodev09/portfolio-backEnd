import mongoose from "mongoose";
import { Router } from 'express';

export interface IUser {
    name: string;
    email: string;
    password: string;
    token: string;
    dev: boolean;
}

export interface IComment {
    author: string | mongoose.Document;
    text: string;
}

export interface IPost {
    author: string | mongoose.Document;
    title: string;
    body: string;
    comments: IComment[];
}

export interface Controller {
    path: string;
    router: Router;
}
