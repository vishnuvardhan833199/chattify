import { Server } from "socket.io";

let io;
const userIdToSocketIdMap = new Map();

export const initSocket = (server, options = {}) => {
  io = new Server(server, options);

  io.on("connection", (socket) => {
    const userId = socket.handshake.query?.userId;
    if (userId) {
      userIdToSocketIdMap.set(userId.toString(), socket.id);
      io.emit("getOnlineUsers", Array.from(userIdToSocketIdMap.keys()));
    }

    socket.on("disconnect", () => {
      if (userId) {
        userIdToSocketIdMap.delete(userId.toString());
        io.emit("getOnlineUsers", Array.from(userIdToSocketIdMap.keys()));
      }
    });
  });

  return io;
};

export const getReceiverSocketId = (receiverUserId) => {
  return userIdToSocketIdMap.get(receiverUserId);
};

export { io };


