import { Socket } from "socket.io";
import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { UserManager } from "./managers/Usermanager";

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "https://omegal-indol.vercel.app";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const userManager = new UserManager();

io.on("connection", (socket: Socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", ({ name }: { name: string }) => {
    console.log("User joined:", name, socket.id);
    userManager.addUser(name, socket);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    userManager.removeUser(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  console.log(`CORS enabled for: ${FRONTEND_URL}`);
});
