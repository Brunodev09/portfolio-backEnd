import express from 'express';
import jwt from "jsonwebtoken";
import { IUser } from "../interfaces";

export default function auth(request: express.Request & { user: IUser }, response: express.Response, next) {
    // x-auth-token --> name of the header param
    const token = request.header('x-auth-token');

    if (!token) return response.status(401).json({error: 'Invalid headers!'});

    try {
        const decoded = jwt.verify(token, process.env.JWT);
        request.user = decoded.user;
        next();

    } catch(e) {
        return response.status(401).json('Token invalid!');
    }
}