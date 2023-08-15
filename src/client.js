const socket = io();

const connections = document.getElementById("connections");
const miningList = document.getElementById("mining-list");
const miningMessage = document.getElementById("mining-message");

let miningProgressInterval = null;

socket.on("connect", () => {
  console.log("서버에 연결되었습니다.");
  socket.emit("ready");
});

socket.on("start-mining", () => {
  socket.emit("start-mining");
});

socket.on("get-connections", (count) => {
  connections.innerText = count;
});

socket.on("mining-in-progress", handleMiningProgress);

socket.on("mining", (data) => {
  addBlockToTable(data.miner, data.blockIndex, data.previousHash, data.hash, data.data, data.nonce, data.timestamp);
  clearInterval(miningProgressInterval);
  miningProgressInterval = null;
  miningMessage.innerText = "채굴 완료!";
});

socket.on("already-mined", () => {
  miningMessage.textContent = "이미 채굴을 완료했습니다. 다시 채굴할 수 없습니다.";
});

fetchBlocks();

async function fetchBlocks() {
  const response = await fetch("/blocks");
  const blocks = await response.json();
  blocks.forEach((block) => {
    addBlockToTable(block.miner, block.height, block.prevHash, block.hash, block.data, block.nonce, block.timestamp);
  });
}

function handleMiningProgress() {
  miningMessage.innerText = "채굴 진행 중...";
  miningProgressInterval = setInterval(() => {
    miningMessage.innerText += ".";
  }, 1000);
}

function addBlockToTable(miner, blockIndex, previousHash, hash, data, nonce, timestamp) {
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>${miner}</td>
    <td class="horizontal-text">${blockIndex}</td>
    <td>${previousHash}</td>
    <td>${hash}</td>
    <td>${data}</td>
    <td>${nonce}</td>
    <td>${timestamp}</td>
  `;
  miningList.appendChild(newRow);
}
