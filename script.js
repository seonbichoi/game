const SIZE = 15;
const HUMAN = 1;
const AI = 2;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const turnText = document.getElementById("turnText");
const turnStone = document.getElementById("turnStone");
const moveCount = document.getElementById("moveCount");
const undoBtn = document.getElementById("undoBtn");
const resetBtn = document.getElementById("resetBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const result = document.getElementById("result");
const resultStone = document.getElementById("resultStone");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const thinking = document.getElementById("thinking");
const singleBtn = document.getElementById("singleBtn");
const multiBtn = document.getElementById("multiBtn");
const modeLabel = document.getElementById("modeLabel");
const modeStatus = document.getElementById("modeStatus");
const tip = document.getElementById("tip");

let board;
let currentPlayer;
let history;
let gameOver;
let winningCells = [];
let mode = "single";
let aiThinking = false;
let aiTimer = null;

function newGame() {
  if (aiTimer) clearTimeout(aiTimer);
  aiTimer = null;
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  currentPlayer = HUMAN;
  history = [];
  gameOver = false;
  aiThinking = false;
  winningCells = [];
  result.classList.add("hidden");
  thinking.classList.add("hidden");
  updateUI();
  drawBoard();
}

function setMode(nextMode) {
  mode = nextMode;
  singleBtn.classList.toggle("active", mode === "single");
  multiBtn.classList.toggle("active", mode === "multi");
  modeLabel.textContent = mode === "single" ? "1인용 · AI 대전" : "2인용 · 친구와 대전";
  modeStatus.textContent = mode === "single" ? "AI 대전" : "로컬 2인용";
  tip.textContent = mode === "single"
    ? "1인용에서는 내가 흑돌, AI가 백돌입니다. 가로·세로·대각선으로 5개 이상 연결하면 승리합니다."
    : "2인용에서는 흑돌과 백돌이 같은 기기에서 번갈아 둡니다. 가로·세로·대각선으로 5개 이상 연결하면 승리합니다.";
  newGame();
}

function geometry() {
  const pad = 36;
  const gap = (canvas.width - pad * 2) / (SIZE - 1);
  return { pad, gap };
}

function drawBoard() {
  const { pad, gap } = geometry();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#e7bc78");
  grad.addColorStop(1, "#c98f45");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(67, 43, 18, .78)";
  ctx.lineWidth = 1.5;

  for (let i = 0; i < SIZE; i++) {
    const p = pad + i * gap;

    ctx.beginPath();
    ctx.moveTo(pad, p);
    ctx.lineTo(canvas.width - pad, p);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p, pad);
    ctx.lineTo(p, canvas.height - pad);
    ctx.stroke();
  }

  const stars = [[3,3], [3,11], [7,7], [11,3], [11,11]];
  ctx.fillStyle = "#4d3217";
  stars.forEach(([r,c]) => {
    ctx.beginPath();
    ctx.arc(pad + c * gap, pad + r * gap, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]) drawStone(r, c, board[r][c]);
    }
  }

  if (history.length) {
    const last = history[history.length - 1];
    const x = pad + last.c * gap;
    const y = pad + last.r * gap;
    ctx.fillStyle = last.player === HUMAN ? "#f2d56b" : "#b54335";
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (winningCells.length) {
    ctx.strokeStyle = "#c94231";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    const first = winningCells[0];
    const last = winningCells[winningCells.length - 1];

    ctx.beginPath();
    ctx.moveTo(pad + first.c * gap, pad + first.r * gap);
    ctx.lineTo(pad + last.c * gap, pad + last.r * gap);
    ctx.stroke();
  }
}

function drawStone(r, c, player) {
  const { pad, gap } = geometry();
  const x = pad + c * gap;
  const y = pad + r * gap;
  const radius = gap * 0.43;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.28)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  const g = ctx.createRadialGradient(
    x - radius * .35,
    y - radius * .4,
    2,
    x,
    y,
    radius
  );

  if (player === HUMAN) {
    g.addColorStop(0, "#686868");
    g.addColorStop(.45, "#242424");
    g.addColorStop(1, "#050505");
  } else {
    g.addColorStop(0, "#ffffff");
    g.addColorStop(.55, "#f4f4f4");
    g.addColorStop(1, "#c9c9c9");
  }

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (player === AI) {
    ctx.strokeStyle = "rgba(80,80,80,.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

function pointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const { pad, gap } = geometry();

  const c = Math.round((x - pad) / gap);
  const r = Math.round((y - pad) / gap);

  if (!inside(r, c)) return null;

  const px = pad + c * gap;
  const py = pad + r * gap;

  if (Math.hypot(x - px, y - py) > gap * .48) return null;
  return { r, c };
}

canvas.addEventListener("click", (event) => {
  if (gameOver || aiThinking) return;
  if (mode === "single" && currentPlayer === AI) return;

  const point = pointFromEvent(event);
  if (!point || board[point.r][point.c] !== 0) return;

  makeMove(point.r, point.c, currentPlayer);

  if (!gameOver && mode === "single" && currentPlayer === AI) {
    scheduleAiMove();
  }
});

function makeMove(r, c, player) {
  board[r][c] = player;
  history.push({ r, c, player });

  const win = getWinningLine(r, c, player);

  if (win) {
    winningCells = win;
    gameOver = true;
    aiThinking = false;
    thinking.classList.add("hidden");
    drawBoard();
    updateUI();
    showResult(player);
    return;
  }

  if (history.length === SIZE * SIZE) {
    gameOver = true;
    aiThinking = false;
    thinking.classList.add("hidden");
    drawBoard();
    showDraw();
    return;
  }

  currentPlayer = currentPlayer === HUMAN ? AI : HUMAN;
  updateUI();
  drawBoard();
}

function scheduleAiMove() {
  aiThinking = true;
  thinking.classList.remove("hidden");
  updateUI();

  aiTimer = setTimeout(() => {
    const move = chooseAiMove();
    if (move && !gameOver) {
      aiThinking = false;
      thinking.classList.add("hidden");
      makeMove(move.r, move.c, AI);
    }
  }, 450);
}

function chooseAiMove() {
  const candidates = getCandidates();

  // 1. AI가 지금 바로 이길 수 있는 수
  for (const move of candidates) {
    if (wouldWin(move.r, move.c, AI)) return move;
  }

  // 2. 사용자가 다음 수에 이기는 자리 차단
  for (const move of candidates) {
    if (wouldWin(move.r, move.c, HUMAN)) return move;
  }

  // 3. 공격/방어 점수 평가
  let bestScore = -Infinity;
  let bestMoves = [];

  for (const move of candidates) {
    const attack = evaluatePosition(move.r, move.c, AI);
    const defense = evaluatePosition(move.r, move.c, HUMAN);
    const centerBonus = 12 - (Math.abs(move.r - 7) + Math.abs(move.c - 7)) * .55;
    const score = attack * 1.12 + defense * 1.05 + centerBonus;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) < 0.001) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function getCandidates() {
  if (history.length === 0) return [{ r: 7, c: 7 }];

  const result = [];
  const seen = new Set();

  for (const h of history) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;

        const r = h.r + dr;
        const c = h.c + dc;
        const key = `${r},${c}`;

        if (inside(r, c) && board[r][c] === 0 && !seen.has(key)) {
          seen.add(key);
          result.push({ r, c });
        }
      }
    }
  }

  return result.length ? result : allEmptyCells();
}

function allEmptyCells() {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
}

function wouldWin(r, c, player) {
  board[r][c] = player;
  const win = getWinningLine(r, c, player);
  board[r][c] = 0;
  return Boolean(win);
}

function evaluatePosition(r, c, player) {
  board[r][c] = player;

  const directions = [[1,0], [0,1], [1,1], [1,-1]];
  let total = 0;

  for (const [dr, dc] of directions) {
    const left = countDirection(r, c, -dr, -dc, player);
    const right = countDirection(r, c, dr, dc, player);
    const count = left.count + right.count + 1;
    const openEnds = left.open + right.open;

    total += lineScore(count, openEnds);
  }

  board[r][c] = 0;
  return total;
}

function countDirection(r, c, dr, dc, player) {
  let count = 0;
  let nr = r + dr;
  let nc = c + dc;

  while (inside(nr, nc) && board[nr][nc] === player) {
    count++;
    nr += dr;
    nc += dc;
  }

  const open = inside(nr, nc) && board[nr][nc] === 0 ? 1 : 0;
  return { count, open };
}

function lineScore(count, openEnds) {
  if (count >= 5) return 100000;
  if (count === 4 && openEnds === 2) return 12000;
  if (count === 4 && openEnds === 1) return 4500;
  if (count === 3 && openEnds === 2) return 1600;
  if (count === 3 && openEnds === 1) return 420;
  if (count === 2 && openEnds === 2) return 160;
  if (count === 2 && openEnds === 1) return 55;
  if (count === 1 && openEnds === 2) return 12;
  return 3;
}

function getWinningLine(r, c, player) {
  const directions = [[1,0], [0,1], [1,1], [1,-1]];

  for (const [dr, dc] of directions) {
    const cells = [{ r, c }];

    let nr = r - dr;
    let nc = c - dc;

    while (inside(nr, nc) && board[nr][nc] === player) {
      cells.unshift({ r: nr, c: nc });
      nr -= dr;
      nc -= dc;
    }

    nr = r + dr;
    nc = c + dc;

    while (inside(nr, nc) && board[nr][nc] === player) {
      cells.push({ r: nr, c: nc });
      nr += dr;
      nc += dc;
    }

    if (cells.length >= 5) return cells;
  }

  return null;
}

function inside(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function undo() {
  if (!history.length || aiThinking) return;

  if (gameOver) {
    gameOver = false;
    winningCells = [];
    result.classList.add("hidden");
  }

  if (mode === "single") {
    // AI 수 + 사용자 수를 한 세트로 무르기
    const removeCount = history.length >= 2 ? 2 : 1;

    for (let i = 0; i < removeCount; i++) {
      const last = history.pop();
      board[last.r][last.c] = 0;
    }

    currentPlayer = HUMAN;
  } else {
    const last = history.pop();
    board[last.r][last.c] = 0;
    currentPlayer = last.player;
  }

  updateUI();
  drawBoard();
}

function updateUI() {
  const black = currentPlayer === HUMAN;
  turnStone.className = `stone ${black ? "black" : "white"}`;

  if (mode === "single") {
    turnText.textContent = currentPlayer === HUMAN ? "내 차례 · 흑돌" : "AI 차례 · 백돌";
  } else {
    turnText.textContent = currentPlayer === HUMAN ? "흑돌" : "백돌";
  }

  moveCount.textContent = `${history.length}수`;
  undoBtn.disabled = history.length === 0 || aiThinking;
}

function showResult(player) {
  const black = player === HUMAN;
  resultStone.className = `result-stone stone ${black ? "black" : "white"}`;

  if (mode === "single") {
    resultTitle.textContent = player === HUMAN ? "승리!" : "AI 승리";
    resultMessage.textContent = player === HUMAN
      ? `${history.length}수 만에 AI를 이겼습니다.`
      : `${history.length}수 만에 AI가 다섯 개를 연결했습니다.`;
  } else {
    resultTitle.textContent = `${black ? "흑돌" : "백돌"} 승리!`;
    resultMessage.textContent = `${history.length}수 만에 다섯 개의 돌을 연결했습니다.`;
  }

  setTimeout(() => result.classList.remove("hidden"), 320);
}

function showDraw() {
  resultStone.className = "result-stone stone white";
  resultTitle.textContent = "무승부!";
  resultMessage.textContent = "오목판의 모든 자리가 채워졌습니다.";
  setTimeout(() => result.classList.remove("hidden"), 250);
}

undoBtn.addEventListener("click", undo);
resetBtn.addEventListener("click", newGame);
playAgainBtn.addEventListener("click", newGame);
singleBtn.addEventListener("click", () => setMode("single"));
multiBtn.addEventListener("click", () => setMode("multi"));

setMode("single");
