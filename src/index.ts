import Server from "./app";
import UserController from "./controllers/user";

const server = new Server([new UserController()], 5000);
server.listen();