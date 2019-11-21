import express from "express";
import logger from "../utils/logger";

export default function logMid(
    request: express.Request,
    response: express.Response,
    next
) {
    logger.warn(`${request.method} ${request.path}`);
    if (request.body) logger.warn(request.body);
    next();
}
