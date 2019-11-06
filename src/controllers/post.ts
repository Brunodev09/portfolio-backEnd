import express from 'express';

import User from '../models/user';
import Post from '../models/post';
import logger from "../utils/logger";
import { IUser, IPost } from "../interfaces";
import mongoose from "mongoose";
import middleware from "../middlewares/auth";

export default class PostController {
    public path = '/post';
    public router = express.Router();

    private user: IUser | mongoose.Document;
    private posts: IPost | IPost[] | mongoose.Document;
    private payload: mongoose.Document;
    private obj: IPost;

    constructor() {
        this.init();
    }

    public init() {
        this.router.post(this.path, middleware, this.create);
        this.router.get(this.path, middleware, this.getAll);
        this.router.get(`${this.path}/:id`, middleware, this.get);
        this.router.put(`${this.path}/:id`, middleware, this.edit);
        this.router.delete(`${this.path}/:id`, middleware, this.delete);
    }

    getAll = async (request: express.Request, response: express.Response) => {
        try {
            this.posts = await Post.find({author: request.user._id});
        } catch(e) {
            logger.info(e);
            return response.status("500").send('Internal server error');
        }

        if (this.posts) return response.status("200").json(this.posts);
    }

    get = async (request: express.Request, response: express.Response) => {
        try {
            this.posts = await Post.findById(request.params.id);
        } catch(e) {
            logger.info(e);
            return response.status("500").send('Internal server error');
        }

        if (this.posts) return response.status("200").json(this.posts);
        return response.status("404").json({error: "No posts were found with this id!"});
    }

    create = async (request: express.Request, response: express.Response) => {

        const { title, body, image } = request.body;
        if (!title || !body) return response.status("500").json({error: "Missing required data!"});

        this.user = await User.findById(request.user._id);

        if (!this.user) return response.status("500").json({error: "No user found!"});

        const { name } = this.user;
        this.obj = { author: request.user._id, name, body, title };
        if (image) this.obj.image = image;

        this.payload = new Post(this.obj);

        try {
            await this.payload.save();
        } catch(e) {
            logger.error(e);
            return response.status("500").send('Internal server error');
        }
        if (this.payload) return response.status("200").json(this.payload);
    }

    edit = async (request: express.Request, response: express.Response) => {

        const { title, body, image } = request.body;
        const { id } = request.params;
        if (!title || !body || !id) return response.status("500").json({error: "Missing required data!"});

        this.user = await User.findById(request.user._id);
        this.payload = await Post.findById(id);

        if (!this.user || !this.payload) return response.status("500").json({error: "No user found!"});

        this.payload.title = title;
        this.payload.body = body;
        if (image) this.obj.image = image;

        try {
            await this.payload.save();
        } catch(e) {
            logger.error(e);
            return response.status("500").send('Internal server error');
        }
        if (this.payload) return response.status("200").json(this.payload);
    }

    delete = async (request: express.Request, response: express.Response) => {

        const { id } = request.params;
        if (!id) return response.status("500").json({error: "Missing required data!"});

        this.user = await User.findById(request.user._id);
        this.payload = await Post.findById(id);

        if (!this.user || !this.payload) return response.status("500").json({error: "No user found!"});

        try {
            await this.payload.remove();
        } catch(e) {
            logger.error(e);
            return response.status("500").send('Internal server error');
        }
        if (this.payload) return response.status("200").json({info: "Document deleted!"});
    }
    
}



