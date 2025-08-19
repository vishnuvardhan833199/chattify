import { Server } from "socket.io";

let io;
// Map userId -> Set(socketId)
const userIdToSocketIdsMap = new Map();

export const initSocket = (server, options = {}) => {
  io = new Server(server, options);

  io.on("connection", (socket) => {
    const userId = socket.handshake.query?.userId?.toString();
    if (userId) {
      const existing = userIdToSocketIdsMap.get(userId) || new Set();
      existing.add(socket.id);
      userIdToSocketIdsMap.set(userId, existing);
      io.emit("getOnlineUsers", Array.from(userIdToSocketIdsMap.keys()));
    }

    // Typing indicators
    socket.on("typing", ({ to }) => {
      forwardToUser(to, "typing", { from: userId });
    });
    socket.on("stopTyping", ({ to }) => {
      forwardToUser(to, "stopTyping", { from: userId });
    });

    // Message delivery/seen
    socket.on("message:delivered", ({ messageId, to }) => {
      forwardToUser(to, "message:delivered", { messageId, from: userId });
    });
    socket.on("message:seen", ({ messageId, to }) => {
      forwardToUser(to, "message:seen", { messageId, from: userId });
    });

    // WebRTC signaling for 1:1 calls
    socket.on("call:offer", ({ to, offer, mediaType }) => {
      forwardToUser(to, "call:incoming", { from: userId, offer, mediaType });
    });
    socket.on("call:answer", ({ to, answer }) => {
      forwardToUser(to, "call:answer", { from: userId, answer });
    });
    socket.on("call:ice-candidate", ({ to, candidate }) => {
      forwardToUser(to, "call:ice-candidate", { from: userId, candidate });
    });
    socket.on("call:end", ({ to, reason }) => {
      forwardToUser(to, "call:end", { from: userId, reason });
    });
    socket.on("call:toggle", ({ to, kind, enabled }) => {
      forwardToUser(to, "call:toggle", { from: userId, kind, enabled });
    });

    socket.on("disconnect", () => {
      if (userId) {
        const set = userIdToSocketIdsMap.get(userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) userIdToSocketIdsMap.delete(userId);
        }
        io.emit("getOnlineUsers", Array.from(userIdToSocketIdsMap.keys()));
      }
    });
  });

  return io;
};

const forwardToUser = (userId, event, payload) => {
  const sockets = userIdToSocketIdsMap.get(userId?.toString());
  if (!sockets) return;
  for (const sid of sockets) io.to(sid).emit(event, payload);
};

export const getReceiverSocketId = (receiverUserId) => {
  const sockets = userIdToSocketIdsMap.get(receiverUserId?.toString());
  if (!sockets || sockets.size === 0) return null;
  // return one socket id arbitrarily
  return Array.from(sockets)[0];
};

export { io };


