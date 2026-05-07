import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado ao Socket:", socket.id);

    socket.on("join:workspace", (workspaceId) => {
      if (workspaceId) {
        const room = `workspace:${workspaceId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} entrou na sala: ${room}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  console.log("Socket.IO inicializado!");
  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("Socket.io não inicializado ainda!");
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
