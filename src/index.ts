import Server from "./app";
import UserController from "./controllers/user";
import AuthenticationController from "./controllers/auth";
import PostController from "./controllers/post";

const server = new Server([new UserController(), new AuthenticationController(), new PostController()], 5000);
server.listen();