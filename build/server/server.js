"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const blockchain_1 = require("../core/blockchain");
const SERVER_ADDRESS = "203.234.55.134";
const P2P_PORT = 80;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const blockchain = new blockchain_1.Blockchain();
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../public", "index.html"));
});
app.get("/blocks", (req, res) => {
    res.json(blockchain.chain);
});
function notifyMining(ip, block) {
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
io.on("connection", (socket) => {
    const ip = socket.handshake.address;
    connections++;
    console.log(`${ip} 사용자가 접속하였습니다.`);
    io.emit("get-connections", connections);
    socket.emit("start-mining"); // 사용자가 새로 연결되면 자동으로 채굴 시작
    socket.on("start-mining", () => {
        const newData = "테스트데이터";
        const newBlock = blockchain.addBlock(newData, ip);
        console.log(`${newData} 추가되었습니다.`);
        notifyMining(ip, newBlock);
        socket.broadcast.emit("mining-in-progress");
    });
    socket.on("get-connections", () => {
        io.emit("get-connections", connections);
    });
    socket.on("disconnect", () => {
        connections--;
        console.log(`${ip} 사용자가 접속을 종료하였습니다.`);
        io.emit("get-connections", connections);
    });
});
server.listen(P2P_PORT, SERVER_ADDRESS, () => {
    console.log(`서버가 http://${SERVER_ADDRESS}:${P2P_PORT}에서 실행 중입니다.`);
});
