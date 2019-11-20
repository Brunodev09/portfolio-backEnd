import express from "express";
import mongoose, { Connection } from "mongoose";
import cors from "cors";
import { join } from "path";
import multer, { diskStorage } from "multer";

import logger from "./utils/logger";

// Middlewares
import logMid from "./middlewares/log";

// Controllers
import { Controller } from "./interfaces";

export default class Server {
    public app: express.Application;
    public port: number;
    connection: Connection;
    private upload = multer({
        storage: diskStorage({
            destination: join(__dirname, "..", "uploads"),
            filename: (req, file, cb) => {
                cb(null, file.originalname);
            }
        })
    });

    constructor(controllers: Controller[]) {
        this.app = express();

        this.DB();
        this.initMiddlewares();
        this.initControllers(controllers);
    }

    public listen() {
        this.app.listen(process.env.PORT || 5000);
    }

    private initMiddlewares() {
        this.app.use(cors());
        this.app.use(
            express.json()
        );
        this.app.use(logMid);
    }

    private initControllers(controllers: Controller[]) {
        for (let controller of controllers) {
            this.app.use("/", this.upload.single("image"), controller.router);
        }
    }

    private DB() {
        try {
            this.connection = mongoose.connect(process.env.MONGO_ACCESS, {
                useNewUrlParser: true,
                useCreateIndex: true,
                useUnifiedTopology: true
            });
            if (this.connection) logger.info("MongoDB is running...");
        } catch (e) {
            logger.error(`MongoDB ERROR: ${e}`);
            process.exit(1);
        }

        mongoose.connection.on("connected", () => {
            logger.info(`Mongoose connection event received!`);
        });

        mongoose.connection.on("error", err => {
            logger.error("Mongoose default connection error: " + err);
        });

        mongoose.connection.on("disconnected", () => {
            logger.info("Mongoose default connection disconnected");
        });

        process.on("SIGINT", () => {
            mongoose.connection.close(function() {
                logger.info(
                    "Mongoose default connection disconnected through app termination"
                );
                process.exit(0);
            });
        });
    }
}
