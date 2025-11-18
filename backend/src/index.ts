import { Socket } from "socket.io";
import http from "node:http";

const express = require("express");
const Server = require("socket.io");
 
const app = express();
const server = http.createServer(app);
const io = new Server(server);
io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
 
server.listen(3000, () => {
  console.log("Listening on port 3000");
});
