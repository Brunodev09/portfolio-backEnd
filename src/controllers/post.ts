import express from 'express';
import sharp from 'sharp';
import path from 'path'
import mongoose from "mongoose";
import { unlinkSync } from 'fs';
import User from '../models/user';
import Post from '../models/post';
import logger from "../utils/logger";
import { IUser, IPost, IComment } from "../interfaces";
import middleware from "../middlewares/auth";   

import { Category } from "../utils/constants";

export default class PostController {
    public path = '/post';
    public router = express.Router();

    private user: IUser | mongoose.Document;
    private posts: IPost | IPost[] | mongoose.Document;
    private comments: IComment | IComment[] | mongoose.Document;
    private payload: mongoose.Document;
    private obj: IPost | IComment;
    private category: Category;

    constructor() {
        this.init();
    }

    public init() {
        this.router.post(this.path, middleware, this.create);
        this.router.get(this.path, this.getAll);
        this.router.get(`${this.path}/:id`, this.get);
        this.router.put(`${this.path}/:id`, middleware, this.edit);
        this.router.delete(`${this.path}/:id`, middleware, this.delete);

        this.router.post(`${this.path}/:id`, middleware, this.createComment);
        this.router.get(`${this.path}/:id`, middleware, this.getAllComments);
        this.router.put(`${this.path}/:id/:cid`, middleware, this.editComment);
        this.router.delete(`${this.path}/:id/:cid`, middleware, this.deleteComment);
    }

    getAll = async (request: express.Request, response: express.Response) => {
        try {
            this.posts = await Post.find({ "private": false });
        } catch (e) {
            logger.info(e);
            return response.status(500).send('Internal server error');
        }

        if (this.posts) return response.status(200).json(this.posts);
    };

    get = async (request: express.Request, response: express.Response) => {
        try {
            this.posts = await Post.findById(request.params.id);
        } catch (e) {
            logger.info(e);
            return response.status(500).send('Internal server error');
        }

        if (this.posts) return response.status(200).json(this.posts);
        return response.status(404).json({ error: "No posts were found with this id!" });
    };

    create = async (request: express.Request & { user: IUser }, response: express.Response) => {
        try {
            let { title, body, privatePost, category } = request.body;

            if (!title || !body) return response.status(500).json({ error: "Missing required data!" });

            if (!category) this.category = Category.GENERAL;
            else {
                try {
                    this.category = category;
                } catch (e) {
                    logger.error(e);
                    this.category = Category.GENERAL;
                }
            }

            this.user = await User.findById(request.user._id);

            if (!this.user) return response.status(500).json({ error: "No user found!" });
            if (!this.user.dev) return response.status(500).json({ error: "User is not authorized to post!" });

            const { name } = this.user;
            this.obj = { author: request.user._id, name, body, title, category: this.category };
            if (privatePost) this.obj.private = privatePost;

            this.payload = new Post(this.obj);

            try {
                await this.payload.save();
            } catch (e) {
                logger.error(e);
                return response.status(500).send('Internal server error');
            }
            if (this.payload) return response.status(200).json(this.payload);
        } catch (e) {
            logger.error(e);
            return response.status(500).send('Internal server error');
        }
    };

    edit = async (request: express.Request & { user: IUser }, response: express.Response) => {

        try {
            let { title, body, image, privatePost, category } = request.body;
            const { id } = request.params;
            if (!title || !body || !id) return response.status(500).json({ error: "Missing required data!" });

            if (!category) this.category = Category.GENERAL;
            else {
                try {
                    this.category = category;
                } catch (e) {
                    logger.error(e);
                    this.category = Category.GENERAL;
                }
            }

            this.user = await User.findById(request.user._id);
            this.payload = await Post.findById(id);

            if (!this.user || !this.payload) return response.status(500).json({ error: "No user found!" });
            if (!this.user.dev) return response.status(500).json({ error: "User is not authorized to edit a post!" });

            this.payload.title = title;
            this.payload.body = body;
            this.payload.category = category;
            if (image) (<IPost>this.payload).image = image;
            if (privatePost) (<IPost>this.payload).private = privatePost;

            try {
                await this.payload.save();
            } catch (e) {
                logger.error(e);
                return response.status(500).send('Internal server error');
            }
            if (this.payload) return response.status(200).json(this.payload);
        } catch (e) {
            logger.error(e);
            return response.status(500).send('Internal server error');
        }
    };

    delete = async (request: express.Request & { user: IUser }, response: express.Response) => {

        const { id } = request.params;
        if (!id) return response.status(500).json({ error: "Missing required data!" });

        this.user = await User.findById(request.user._id);
        this.payload = await Post.findById(id);

        if (!this.user || !this.payload) return response.status(500).json({ error: "No user found!" });
        if (!this.user.dev) return response.status(500).json({ error: "User is not authorized to delete a post!" });

        try {
            await this.payload.remove();
        } catch (e) {
            logger.error(e);
            return response.status(500).send('Internal server error');
        }
        if (this.payload) return response.status(200).json({ info: "Document deleted!" });
    };

    createComment = async (request: express.Request & { user: IUser }, response: express.Response) => {

        try {
            const { id } = request.params;
            const { text } = request.body;

            if (!id || !text) return response.status(500).json({ error: "Missing required data!" });

            try {
                this.user = await User.findById(request.user._id);
                this.posts = await Post.findById(id);
            } catch (e) {
                logger.error(e);
                return response.status(500).json({ error: "Internal server error!" });
            }

            if (!this.user || !this.posts) return response.status(500).json({ error: "No user or posts found!" });

            this.posts.comments.push({ author: request.user._id, text });

            try {
                await this.posts.save();
            } catch (e) {
                logger.error(e);
                return response.status(500).send('Internal server error');
            }

            return response.status(200).json(this.posts);
        } catch (e) {
            logger.error(e);
            return response.status(500).json({ error: "Internal server error!" });

        }
    };

    getAllComments = async (request: express.Request, response: express.Response) => {

        const { id } = request.params;
        if (!id) return response.status(500).json({ error: "Missing required data!" });

        try {
            this.posts = await Post.findById(id);
        } catch (e) {
            logger.error(e);
            return response.status(500).json({ error: "Internal server error!" });
        }

        if (!this.posts || !this.posts.comments.length) return response.status(500).json({ error: "No user or posts found!" });

        return response.status(200).json(this.posts.comments);

    };

    editComment = async (request: express.Request, response: express.Response) => {

        try {
            const { id, cid } = request.params;
            const { text } = request.body;

            if (!id || !cid || !text) return response.status(500).json({ error: "Missing required data!" });

            try {
                this.posts = await Post.findById(id);
            } catch (e) {
                logger.error(e);
                return response.status(500).json({ error: "Internal server error!" });
            }

            if (!this.posts || !this.posts.comments.length) return response.status(500).json({ error: "No user or posts found!" });

            const index = this.posts.comments.findIndex(comment => comment._id.toString() === cid);

            if (index === null || index === undefined) return response.status(500).json({ error: "No comment associated with this id in this post!" });

            this.posts.comments[index].text = text;

            try {
                this.posts.save();
            } catch (e) {
                logger.error(e);
                return response.status(500).json({ error: "Internal server error!" });
            }

            return response.status(200).json(this.posts.comments[index]);
        } catch (e) {
            logger.error(e);
            return response.status(500).json({ error: "Internal server error!" });
        }
    };

    deleteComment = async (request: express.Request, response: express.Response) => {

        const { id, cid } = request.params;
        if (!id || !cid) return response.status(500).json({ error: "Missing required data!" });

        try {
            this.posts = await Post.findById(id);
        } catch (e) {
            logger.error(e);
            return response.status(500).json({ error: "Internal server error!" });
        }

        if (!this.posts || !this.posts.comments.length) return response.status(500).json({ error: "No user or posts found!" });

        const index = this.posts.comments.findIndex(comment => comment._id.toString() === cid);

        if (index === null || index === undefined) return response.status(500).json({ error: "No comment associated with this id in this post!" });

        this.posts.comments.splice(index, 1);

        try {
            this.posts.save();
        } catch (e) {
            logger.error(e);
            return response.status(500).json({ error: "Internal server error!" });
        }

        return response.status(200).json(this.posts.comments);

    };

}



