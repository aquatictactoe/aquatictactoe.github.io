const firebaseConfig = {
  apiKey: "AIzaSyDL_gFAjzDYn7UT4OMO8RBQtEE1cXgAWRM",
  authDomain: "tictactoe-81cd5.firebaseapp.com",
  projectId: "tictactoe-81cd5",
  storageBucket: "tictactoe-81cd5.firebasestorage.app",
  messagingSenderId: "31391867375",
  appId: "1:31391867375:web:886a9ee074d1900ea5161a",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let player = null;
let playerSymbol = null;
let unsubscribe = null;
const gameId = "multiplayer-tictactoe";

async function joinGame() {
  player = document.getElementById("playerName").value.trim();
  if (!player) return alert("Enter a name");

  await ensurePlayerStats(player); // make sure player has stats

  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();
  let data = gameDoc.exists ? gameDoc.data() : null;

  if (!gameDoc.exists || !data.playerX) {
    await gameRef.set({
      board: Array(9).fill(null),
      turn: "X",
      playerX: player,
      playerO: null,
      status: "playing", // playing | ended
      winner: null
    });
    playerSymbol = "X";
  } else if (!data.playerO && data.playerX !== player) {
    await gameRef.update({ playerO: player });
    playerSymbol = "O";
  } else {
    return alert("Game full or name taken");
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("gameArea").style.display = "block";
  document.getElementById("playerInfo").textContent = `You are ${player} (${playerSymbol})`;

  subscribeToGame();
}

function subscribeToGame() {
  const gameRef = db.collection("games").doc(gameId);
  unsubscribe = gameRef.onSnapshot(doc => {
    const data = doc.data();
    renderBoard(data);
    updateGameStatus(data);
  });
}

function renderBoard(data) {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  data.board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.textContent = cell || "";
    if (!cell && data.turn === playerSymbol && data.status === "playing") {
      div.addEventListener("click", () => makeMove(i, data));
    }
    boardEl.appendChild(div);
  });
}

function updateGameStatus(data) {
  const statusEl = document.getElementById("gameStatus");
  if (data.status === "ended") {
    statusEl.textContent = data.winner
      ? `Game Over! Winner: ${data.winner}`
      : `Game Over! It's a Draw.`;
  } else {
    statusEl.textContent = `Turn: ${data.turn}`;
  }
}

async function makeMove(index, data) {
  if (data.board[index] || data.status !== "playing") return;

  const newBoard = [...data.board];
  newBoard[index] = playerSymbol;

  const winner = getWinner(newBoard);
  const isDraw = !newBoard.includes(null);

  const gameRef = db.collection("games").doc(gameId);

  if (winner) {
    await gameRef.update({
      board: newBoard,
      status: "ended",
      winner: player
    });
    await updatePlayerStats(player, "win");
    const opponent = playerSymbol === "X" ? data.playerO : data.playerX;
    if (opponent) await updatePlayerStats(opponent, "loss");
  } else if (isDraw) {
    await gameRef.update({
      board: newBoard,
      status: "ended",
      winner: null
    });
    await updatePlayerStats(data.playerX, "draw");
    await updatePlayerStats(data.playerO, "draw");
  } else {
    await gameRef.update({
      board: newBoard,
      turn: playerSymbol === "X" ? "O" : "X"
    });
  }
}

function getWinner(board) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return combos.find(([a,b,c]) =>
    board[a] && board[a] === board[b] && board[a] === board[c]
  );
}

// Firestore helpers for player scoring
async function ensurePlayerStats(name) {
  const ref = db.collection("players").doc(name);
  const doc = await ref.get();
  if (!doc.exists) {
    await ref.set({ wins: 0, losses: 0, draws: 0 });
  }
}

async function updatePlayerStats(name, result) {
  const ref = db.collection("players").doc(name);
  const field = result === "win" ? "wins" : result === "loss" ? "losses" : "draws";
  await ref.update({ [field]: firebase.firestore.FieldValue.increment(1) });
}

async function startNewGame() {
  const gameRef = db.collection("games").doc(gameId);
  const doc = await gameRef.get();
  const data = doc.data();
  if (data.status === "playing") return alert("Game is still ongoing.");

  await gameRef.update({
    board: Array(9).fill(null),
    turn: "X",
    status: "playing",
    winner: null
  });
}

