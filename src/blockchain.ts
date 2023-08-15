import crypto from 'crypto';

interface BlockShape {
  hash: string;
  prevHash: string;
  height: number;
  data: string;
  nonce: number;
  miner: string;
  timestamp: number;
}

function generateZeroSequence(difficulty: number): string {
  return Array(difficulty + 1).join('0');
}

// 난이도 계산 함수
function calculateDifficulty(chain: Block[]): number {
  return 3;
}

export class Block implements BlockShape {
  hash: string;
  prevHash: string;
  height: number;
  data: string;
  nonce: number;
  miner: string;
  timestamp: number;
  difficulty: number;

  constructor(prevHash: string, height: number, data: string, miner: string, chain: Block[]) {
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

  // sha-256
  calculateHash(): string {
    const hash = crypto
      .createHash('sha256')
      .update(this.prevHash + this.height.toString() + this.data + this.nonce.toString() + this.difficulty.toString())
      .digest('hex');
    return hash;
  }

  // nonce 
  mineBlock(): void {
    const zeroSequence = generateZeroSequence(this.difficulty);
    while (this.hash.substring(0, this.difficulty) !== zeroSequence) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

export class Blockchain {
  chain: Block[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  // 첫 블록 생성
  createGenesisBlock(): Block {
    const genesisHeight = 0;
    const genesisPrevHash = '';
    const genesisData = '🧊 Ice Block';
    const genesisMiner = '🐟 Under the sea';
    const genesisBlock = new Block(genesisPrevHash, genesisHeight, genesisData, genesisMiner, this.chain);
    genesisBlock.difficulty = 1;
    genesisBlock.hash = genesisBlock.calculateHash();
    genesisBlock.mineBlock();
    return genesisBlock;
  }

  // 블록 추가 
  addBlock(data: string, miner: string): Block {
    const newHeight = this.chain.length;
    const prevHash = this.getLatestBlock().hash;
    const newBlock = new Block(prevHash, newHeight, data, miner, this.chain);
    newBlock.mineBlock();
    this.chain.push(newBlock);
    return newBlock;
  }

  // 최근 블록 get
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  // Valid
  isValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      const zeroSequence = generateZeroSequence(currentBlock.difficulty);

      if (currentBlock.hash !== currentBlock.calculateHash()) return false;
      if (currentBlock.prevHash !== previousBlock.hash) return false;
      if (currentBlock.hash.substring(0, currentBlock.difficulty) !== zeroSequence) return false;
    }
    return true;
  }
}
