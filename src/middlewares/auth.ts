import express from 'express';
import jwt from "jsonwebtoken";
import config from "../config.json";

export default function auth(request: express.Request, response: express.Response, next) {
    // x-auth-token --> name of the header param
    const token = request.header('x-auth-token');

    if (!token) return response.status("401").json({msg: 'Invalid headers!'});

    try {
        const decoded = jwt.verify(token, config.jwt);
        request.user = decoded.user;
        next();

    } catch(e) {
        return response.status("401").json('Token invalid!');
    }
}