import { Socket } from "socket.io";
import http from "node:http";
import express from "express";
import cors, { CorsOptions } from "cors";
import { Server } from "socket.io";
import { UserManager } from "./managers/Usermanager";

const app = express();

const FRONTEND_URLS =
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  "https://omegal-indol.vercel.app";

const allowedOrigins = FRONTEND_URLS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`❌ Blocked CORS request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    ...corsOptions,
    methods: ["GET", "POST"]
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
  console.log("CORS enabled for origins:", allowedOrigins);
});
