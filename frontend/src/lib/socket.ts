import { io, Socket } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.23:3001";

// Singleton socket instance
export const socket: Socket = io(socketUrl, {
    withCredentials: true,
    transports: ['polling', 'websocket'],
    autoConnect: true,
});

socket.on("connect", () => {
    console.log("✅ Socket Conectado (Singleton):", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("❌ Socket Desconectado (Singleton):", reason);
});

socket.on("connect_error", (error) => {
    console.error("⚠️ Erro de Conexão Socket:", error);
});
