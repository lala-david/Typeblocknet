"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const blockchain_1 = require("./blockchain");
const SERVER_ADDRESS = "203.234.55.134";
const P2P_PORT = 80;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const blockchain = new blockchain_1.Blockchain();
app.use(express_1.default.static(path_1.default.join(__dirname, "./")));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "./", "index.html"));
});
app.get("/blocks", (req, res) => {
    res.json(blockchain.chain);
});
function notifyMining(ip, block) {
    io.emit("mining-complete", {
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
// 채굴 작업 결과를 처리하는 로직 추가
function handleMiningResult(ip, result) {
    const currentBlock = blockchain.getLatestBlock();
    if (result.nonce === -1) {
        console.log(`${ip} 사용자가 채굴 작업을 중단했습니다.`);
        return;
    }
    if (result.hash === currentBlock.hash) {
        console.log(`${ip} 사용자가 성공적으로 블록을 채굴했습니다.`);
        notifyMining(ip, currentBlock);
    }
    else {
        console.log(`${ip} 사용자의 채굴 작업 결과가 일치하지 않습니다.`);
    }
}
let connections = 0;
const connectedIPs = new Set();
const minedIPs = new Set(); // IPs that have mined
const serverStartTime = Date.now();
function disconnectClient(socket, ip) {
    connectedIPs.delete(ip);
    connections--;
    console.log(`${ip} 사용자가 접속을 종료하였습니다.`);
    io.emit("get-connections", connections);
}
io.on("connection", (socket) => {
    var _a;
    const ip = (typeof socket.handshake.headers["x-forwarded-for"] === "string"
        ? socket.handshake.headers["x-forwarded-for"]
        : (_a = socket.handshake.headers["x-forwarded-for"]) === null || _a === void 0 ? void 0 : _a[0]) ||
        socket.handshake.address;
    if (!connectedIPs.has(ip)) {
        connectedIPs.add(ip);
        connections++;
        console.log(`${ip} 사용자가 접속하였습니다.`);
        io.emit("get-connections", connections);
    }
    else {
        console.log(`${ip} 사용자가 재접속하였습니다.`);
    }
    socket.on("ready", () => {
        socket.emit("start-mining", ip);
    });
    socket.on("start-mining", (id) => {
        if (!minedIPs.has(ip)) {
            const newData = "BI";
            const newBlock = blockchain.addBlock(newData, ip);
            console.log(`${newData} 추가되었습니다.`);
            notifyMining(ip, newBlock);
            minedIPs.add(ip); // Mark the IP as having successfully mined a block
        }
    });
    // 추가된 부분: mining-in-progress 이벤트 핸들러
    // 다른 노드가 블록 채굴에 성공했을 때 이벤트를 전파하고 노드들을 멈추게 함
    socket.on("mining-in-progress", () => {
        socket.broadcast.emit("mining-in-progress");
    });
    socket.on("get-connections", () => {
        io.emit("get-connections", connections);
    });
    socket.on("mining-hash", (result) => {
        handleMiningResult(ip, result);
    });
    socket.on("disconnect", () => {
        disconnectClient(socket, ip);
    });
});
server.listen(P2P_PORT, SERVER_ADDRESS, () => {
    console.log(`서버가 http://${SERVER_ADDRESS}:${P2P_PORT}에서 실행 중입니다.`);
});
