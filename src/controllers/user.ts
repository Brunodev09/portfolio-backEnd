import express from 'express';

import jwt from 'jsonwebtoken';
import User from '../models/user';
import config from '../config.json';
import {SHA512} from "crypto-js";
import logger from "../utils/logger";
import {IUser} from "../interfaces";
import mongoose from "mongoose";
import Base64 from "crypto-js/enc-base64";
import UTF8 from "crypto-js/enc-utf8";


export default class UserController {
    public path = '/user';
    public router = express.Router();

    private user: IUser | mongoose.Document;

    constructor() {
        this.init();
    }

    public init() {
        this.router.post(this.path, this.create);
    }

    create = async (request: express.Request, response: express.Response) => {
        const {name, email, password} = request.body;
        if (!name || !email || !password) return response.status("400").json({error: "Missing required data!"});

        try {
            this.user = await User.findOne({email: email});

            if (this.user) {
                return response.status("400").json({errors: 'User already exists!'});
            }

            this.user = new User({name, email, password});

            this.user.password = SHA512(this.user.password);
            this.user.password = Base64.stringify(UTF8.parse(this.user.password));

            await this.user.save();

            const payload = {
                user: this.user
            };
            jwt.sign(payload, config.jwt, {expiresIn: 360000}, (err, token) => {
                if (err) throw err;
                response.status("200").json({token});
            });

        } catch (e) {
            logger.error(e.message || e);
            response.status("500").send('Server error!');
        }
    }
}



