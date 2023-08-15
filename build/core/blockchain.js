"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blockchain = exports.Block = void 0;
const crypto_1 = __importDefault(require("crypto"));
const DIFFICULTY = 4;
function generateZeroSequence(difficulty) {
    return Array(difficulty + 1).join('0');
}
class Block {
    constructor(prevHash, height, data, miner) {
        this.prevHash = prevHash;
        this.height = height;
        this.data = data;
        this.nonce = 0;
        this.miner = miner;
        this.timestamp = Date.now();
        this.hash = this.calculateHash();
    }
    calculateHash() {
        const hash = crypto_1.default
            .createHash('sha256')
            .update(this.prevHash + this.height.toString() + this.data + this.nonce.toString())
            .digest('hex');
        return hash;
    }
    mineBlock(difficulty) {
        const zeroSequence = generateZeroSequence(difficulty);
        while (this.hash.substring(0, difficulty) !== zeroSequence) {
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
    getLastMinedTime() {
        return this.chain[this.chain.length - 1].timestamp;
    }
    createGenesisBlock() {
        const genesisHeight = 0;
        const genesisPrevHash = '';
        const genesisData = '💙 Genesis block';
        const genesisMiner = 'undefined';
        return new Block(genesisPrevHash, genesisHeight, genesisData, genesisMiner);
    }
    addBlock(data, miner) {
        const newHeight = this.chain.length;
        const prevHash = this.getLatestBlock().hash;
        const newBlock = new Block(prevHash, newHeight, data, miner);
        newBlock.mineBlock(DIFFICULTY);
        this.chain.push(newBlock);
        return newBlock;
    }
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
}
exports.Blockchain = Blockchain;
