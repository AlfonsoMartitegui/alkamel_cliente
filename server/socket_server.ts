import * as socketio from "socket.io";

export const ioServer: socketio.Server = new socketio.Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

ioServer.on("connection", (socket: socketio.Socket) => {
  console.log("connection");
  socket.emit("status", "Hello from Socket.io");

  socket.on("disconnect", () => {
    console.log("client disconnected");
  });
});
