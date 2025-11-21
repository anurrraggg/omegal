import { Socket } from "socket.io";
import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
