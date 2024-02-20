import express, { Express, Request, Response } from "express";
import * as http from "http";
import next, { NextApiHandler } from "next";
import * as socketio from "socket.io";
import { ppTrackerClient } from "./ppTrackerdataServerIoClient";

const port: number = parseInt(process.env.PORT || "3007", 10);
const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  const app: Express = express();
  const server: http.Server = http.createServer(app);
  // const server = http.createServer(function (req, res) {
  //   // Set CORS headers
  //   res.setHeader("Access-Control-Allow-Origin", "*");
  //   res.setHeader("Access-Control-Request-Method", "*");
  //   res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  //   res.setHeader("Access-Control-Allow-Headers", "*");
  //   if (req.method === "OPTIONS") {
  //     res.writeHead(200);
  //     res.end();
  //     return;
  //   }

  //   // ...
  // });
  const ioServer: socketio.Server = new socketio.Server({
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  ioServer.attach(server);

  app.get("/hello", async (_: Request, res: Response) => {
    res.send("Hello World");
  });

  ioServer.on("connection", (socket: socketio.Socket) => {
    console.log("connection");
    socket.emit("status", "Hello??? from Socket.io");

    socket.on("disconnect", () => {
      console.log("client disconnected");
    });
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}}`);
  });

  ppTrackerClient.start();
});
