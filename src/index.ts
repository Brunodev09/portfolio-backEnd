import Server from "./app";
import UserController from "./controllers/user";
import AuthenticationController from "./controllers/auth";
import PostController from "./controllers/post";
//@ts-ignore
const server = new Server([new UserController(), new AuthenticationController(), new PostController()], process.env.PORT | 5000);
server.listen();