import express from "express";
import mongoose, { Connection } from "mongoose";
import cors from "cors";
import config from "./config.json";

import logger from "./utils/logger";

// Middlewares
import logMid from "./middlewares/log";

// Controllers
import { Controller } from "./interfaces";

export default class Server {
    public app: express.Application;
    public port: number;
    connection: Connection;

    constructor(controllers: Controller[], port) {
        this.app = express();
        this.port = port;

        this.DB();
        this.initMiddlewares();
        this.initControllers(controllers);
    }

    public listen() {
        this.app.listen(this.port, () => logger.info(`Server running on port ${this.port}`));
    }

    private initMiddlewares() {
        this.app.use(logMid);
        this.app.use(cors());
        this.app.use(express.json({
            extended: false
        }));
    }

    private initControllers(controllers: Controller[]) {
        for (let controller of controllers) {
            this.app.use('/', controller.router);
        }
    }

    private DB() {
        try {
            this.connection = mongoose.connect(config.mongoAccess, {
                useNewUrlParser: true,
                useCreateIndex: true,
                useUnifiedTopology: true
            });
            if (this.connection) logger.info("MongoDB is running...");
        } catch (e) {
            logger.error(`MongoDB ERROR: ${e}`);
            process.exit(1);
        }

        mongoose.connection.on('connected', () => {
            logger.info(`Mongoose connection event received!`);
        });

        mongoose.connection.on('error', (err) => {
            logger.error('Mongoose default connection error: ' + err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.info('Mongoose default connection disconnected');
        });

        process.on('SIGINT', () => {
            mongoose.connection.close(function () {
                logger.info('Mongoose default connection disconnected through app termination');
                process.exit(0);
            });
        });
    }
}
