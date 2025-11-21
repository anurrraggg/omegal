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
  console.log("✅ User connected:", socket.id);

  socket.on("join", ({ name }: { name: string }) => {
    if (!name || name.trim().length === 0) {
      socket.emit("error", { message: "Name is required" });
      return;
    }
    console.log("👤 User joined:", name, socket.id);
    userManager.addUser(name.trim(), socket);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ User disconnected:", socket.id, "Reason:", reason);
    userManager.removeUser(socket.id);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  console.log(`CORS enabled for: ${FRONTEND_URL}`);
});
