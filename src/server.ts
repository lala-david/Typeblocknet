import express from "express";
import http from "http";
import { Server as SocketIoServer, Socket } from "socket.io";
import path from "path";
import { Block, Blockchain } from "./blockchain";

const SERVER_ADDRESS = "203.234.55.134";
const P2P_PORT = 80;

const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server);

const blockchain = new Blockchain();
app.use(express.static(path.join(__dirname, "./")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./", "index.html"));
});

app.get("/blocks", (req, res) => {
  res.json(blockchain.chain);
});

function notifyMining(ip: string, block: Block) {
  io.emit("mining", {
    ip,
    blockIndex: block.height,
    previousHash: block.prevHash,
    hash: block.hash,
    data: block.data,
    nonce: block.nonce,
    miner: block.miner,
    timestamp: block.timestamp,
  });
}

let connections = 0;
const connectedIPs: Set<string> = new Set();
const minedIPs: Set<string> = new Set(); // IPs that have mined
 

function disconnectClient(socket: Socket, ip: string) {
  connectedIPs.delete(ip);
  connections--;
  console.log(`${ip} 사용자가 접속을 종료하였습니다.`);
  io.emit("get-connections", connections);
}

io.on("connection", (socket) => {
  const ip =
    (typeof socket.handshake.headers["x-forwarded-for"] === "string"
      ? socket.handshake.headers["x-forwarded-for"]
      : socket.handshake.headers["x-forwarded-for"]?.[0]) ||
    socket.handshake.address;

  if (!connectedIPs.has(ip)) {
    connectedIPs.add(ip);
    connections++;
    console.log(`${ip} 사용자가 접속하였습니다.`);
    io.emit("get-connections", connections);
  } else {
    console.log(`${ip} 사용자가 재접속하였습니다.`);
  }

  socket.on("ready", () => {
    socket.emit("start-mining", ip);
  });

  socket.on("start-mining", (id) => {
    if (!minedIPs.has(ip)) {
      const newData = "🧊 Ice Block";
      const newBlock = blockchain.addBlock(newData, ip);
      console.log(`${newData} 추가되었습니다.`);
      notifyMining(ip, newBlock);

      minedIPs.add(ip); // Mark the IP as having successfully mined a block
    }
  });

 
  // 다른 노드가 블록 채굴에 성공했을 때 이벤트를 전파하고 노드들을 멈추게 함
  socket.on("mining-in-progress", () => {
    socket.broadcast.emit("mining-in-progress");
  });

  socket.on("get-connections", () => {
    io.emit("get-connections", connections);
  });

  socket.on("disconnect", () => {
    disconnectClient(socket, ip);
  });
});

server.listen(P2P_PORT, SERVER_ADDRESS, () => {
  console.log(`서버가 http://${SERVER_ADDRESS}:${P2P_PORT}에서 실행 중입니다.`);
});
