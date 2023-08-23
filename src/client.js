const socket = io();

const connections = document.getElementById("connections");
const miningList = document.getElementById("mining-list");
const miningMessage = document.getElementById("mining-message");

let miningProgressInterval = null;
let foundBlock = null; // 여기에 변수 추가


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
    updateGraph(blocks);
}

function handleMiningProgress() {
  // 일정 시간 후 채굴 메시지를 비워줍니다.
  setTimeout(() => {
    miningMessage.innerText = "";
  }, 60000);

  miningMessage.innerText = "채굴 진행 중...";
  clearInterval(miningProgressInterval); // 중복 실행을 방지하기 위해 이전의 동작을 삭제합니다.
  miningProgressInterval = setInterval(() => {
    miningMessage.innerText += ".";
  }, 1000);
}

const svg = d3.select('body').append('svg') // 이 부분을 추가합니다.
    .attr('width', 1600)
    .attr('height', 800)
    .attr('transform', 'translate(100, 0)');

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

const searchButton = document.getElementById("search-button");
const searchResult = document.getElementById("search-result");

searchButton.addEventListener("click", async () => {
    const blockIndex = document.getElementById("block-index").value;
    const response = await fetch(`/blocks/${blockIndex}`); 
    const blocks = await response.json();

    if (blockIndex >= 0 && blockIndex < blocks.length) {
        const block = blocks[blockIndex];
        searchResult.innerHTML = JSON.stringify(block, null, 2);
    } else {
        searchResult.textContent = "블록을 찾을 수 없습니다.";
    }
});


function updateGraph(blocks) {
  const nodes = blocks.map((block, index) => {
      const savedNode = localStorage.getItem(`block-${block.height}`);
      if (savedNode) {
          return JSON.parse(savedNode);
      } else {
          const newNode = {
              id: `block-${block.height}`,
              label: `#${block.height}`,
              cx: 180 + (index * 100),
              cy: 50 + Math.floor(Math.random() * 300),
          };
          localStorage.setItem(`block-${block.height}`, JSON.stringify(newNode));
          return newNode;
      }
  });

    const nodeElements = svg.selectAll('g').data(nodes);

    const enteringNodes = nodeElements.enter().append('g');

    const nodeLinks = blocks.slice(1).map((block, index) => ({
        source: `block-${index}`,
        target: `block-${block.height}`,
    }));

    const linkElements = svg.selectAll('.line').data(nodeLinks);

    linkElements.enter().append('line')
        .attr('class', 'line')
        .attr('x1', (link) => nodes.find((node) => node.id === link.source).cx)
        .attr('y1', (link) => nodes.find((node) => node.id === link.source).cy)
        .attr('x2', (link) => nodes.find((node) => node.id === link.target).cx)
        .attr('y2', (link) => nodes.find((node) => node.id === link.target).cy)
        .attr('stroke', '#7db9e8')
        .attr('stroke-width', 1);

    enteringNodes.append('circle')
        .attr('r', 20)
        .style('fill', '#7db9e8')
        .attr('cx', (node) => node.cx)
        .attr('cy', (node) => node.cy);

    enteringNodes.append('text')
        .attr('x', (node) => node.cx)
        .attr('y', (node) => node.cy)
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .style('fill', 'white')
        .style('font-weight', 'bold')
        .text((node) => node.label);

    nodeElements.exit().remove();
}
