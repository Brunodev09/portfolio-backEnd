import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(__dirname, "../.env") })

import Server from "./app";
import UserController from "./controllers/user";
import AuthenticationController from "./controllers/auth";
import PostController from "./controllers/post";
//@ts-ignore
const server = new Server([new UserController(), new AuthenticationController(), new PostController()]);
server.listen();