
import express from 'express';

import jwt from 'jsonwebtoken';
import User from '../models/user';
import config from '../config.json';
import { SHA512 } from "crypto-js";
import logger from "../utils/logger";
import { IUser } from "../interfaces";
import mongoose from "mongoose";
import Base64 from "crypto-js/enc-base64";
import UTF8 from "crypto-js/enc-utf8";
import Expressions from "../utils/expressions";
import middleware from "../middlewares/auth";

export default class UserController {
    public path = '/login';
    public router = express.Router();

    private user: IUser | mongoose.Document;

    constructor() {
        this.init();
    }

    public init() {
        this.router.get(this.path, middleware, this.getUser);
        this.router.post(this.path, this.login);
    }

    getUser = async (request: express.Request, response: express.Response) => {
        try {
            this.user = await User.findById(request.user._id).select('-password');
            if (this.user) return response.json(this.user);
            return response.json({error: `User does not exists!`});

        } catch (e) {
            logger.error(e.message);
            return response.status("500").send('Internal server error');
        }
    };

    login = async (request: express.Request, response: express.Response) => {
        let { email, password } = request.body;
        if (!email || !password) return response.status("400").json({ error: "Missing required data!" });

        if (!(Expressions.email(email))) return response.status("500").json({error: "Invalid e-mail!"});

        try {
            this.user = await User.findOne({ email: email });

            if (!this.user) return response.status("500").json({ errors: 'No user with this credentials!' });

            password = SHA512(password);
            password = Base64.stringify(UTF8.parse(password));

            if (this.user.password !== password) return response.status("500").json({ errors: 'Password incorrect!' });

            const payload = {
                user: this.user
            };
            jwt.sign(payload, config.jwt, { expiresIn: 360000 }, (err, token) => {
                if (err) throw err;
                response.status("200").json({ token });
            });

        } catch (e) {
            logger.error(e.message || e);
            response.status("500").send('Server error!');
        }
    }
}



