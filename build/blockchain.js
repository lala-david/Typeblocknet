"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blockchain = exports.Block = void 0;
const crypto_1 = __importDefault(require("crypto"));
// 난이도에 따른 0 시퀀스 생성
function generateZeroSequence(difficulty) {
    return Array(difficulty + 1).join('0');
}
// 난이도 계산 함수
function calculateDifficulty(chain) {
    return 3;
}
class Block {
    constructor(prevHash, height, data, miner, chain) {
        this.prevHash = prevHash;
        this.height = height;
        this.data = data;
        this.nonce = 0;
        this.miner = miner;
        this.timestamp = Date.now();
        this.difficulty = calculateDifficulty(chain);
        this.hash = this.calculateHash();
        this.mineBlock();
    }
    // 블록의 해시 계산
    calculateHash() {
        const hash = crypto_1.default
            .createHash('sha256')
            .update(this.prevHash + this.height.toString() + this.data + this.nonce.toString() + this.difficulty.toString())
            .digest('hex');
        return hash;
    }
    // 난이도에 따라 블록 채굴
    mineBlock() {
        const zeroSequence = generateZeroSequence(this.difficulty);
        while (this.hash.substring(0, this.difficulty) !== zeroSequence) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }
}
exports.Block = Block;
class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
    }
    // 제네시스 블록 생성
    createGenesisBlock() {
        const genesisHeight = 0;
        const genesisPrevHash = '';
        const genesisData = '🧊 제네시스 블록';
        const genesisMiner = '🤴🏻 관리자';
        const genesisBlock = new Block(genesisPrevHash, genesisHeight, genesisData, genesisMiner, this.chain);
        genesisBlock.difficulty = 1;
        genesisBlock.hash = genesisBlock.calculateHash();
        genesisBlock.mineBlock();
        return genesisBlock;
    }
    // 블록을 블록체인에 추가
    addBlock(data, miner) {
        const newHeight = this.chain.length;
        const prevHash = this.getLatestBlock().hash;
        const newBlock = new Block(prevHash, newHeight, data, miner, this.chain);
        newBlock.mineBlock();
        this.chain.push(newBlock);
        return newBlock;
    }
    // 가장 최근 블록 얻기
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
    // 블록체인의 유효성 검사
    isValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            const zeroSequence = generateZeroSequence(currentBlock.difficulty);
            if (currentBlock.hash !== currentBlock.calculateHash())
                return false;
            if (currentBlock.prevHash !== previousBlock.hash)
                return false;
            if (currentBlock.hash.substring(0, currentBlock.difficulty) !== zeroSequence)
                return false;
        }
        return true;
    }
}
exports.Blockchain = Blockchain;
