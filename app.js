// Firebase config
const firebaseConfig = {
apiKey: "AIzaSyDL_gFAjzDYn7UT4OMO8RBQtEE1cXgAWRM",
  authDomain: "tictactoe-81cd5.firebaseapp.com",
  projectId: "tictactoe-81cd5",
  storageBucket: "tictactoe-81cd5.firebasestorage.app",
  messagingSenderId: "31391867375",
  appId: "1:31391867375:web:886a9ee074d1900ea5161a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let player = null;
let playerSymbol = null;
const gameId = "tictactoe-multiplayer";

async function joinGame() {
  player = document.getElementById("playerName").value.trim();
  if (!player) return alert("Enter your name");

  await ensurePlayerStats(player);

  const gameRef = db.ref(`/games/${gameId}`);
  gameRef.once('value', snapshot => {
    const game = snapshot.val();
    if (!game || !game.playerX) {
      gameRef.set({
        board: Array(9).fill(null),
        turn: "X",
        playerX: player,
        playerO: null,
        status: "playing",
        winner: null
      });
      playerSymbol = "X";
    } else if (!game.playerO && game.playerX !== player) {
      gameRef.update({ playerO: player });
      playerSymbol = "O";
    } else {
      return alert("Game full or name taken");
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
    document.getElementById("playerInfo").textContent = `You are ${player} (${playerSymbol})`;

    subscribeToGame();
  });
}

function subscribeToGame() {
  const gameRef = db.ref(`/games/${gameId}`);
  gameRef.on('value', snapshot => {
    const data = snapshot.val();
    if (!data) return;
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

function makeMove(index, data) {
  if (data.board[index] || data.status !== "playing") return;

  const newBoard = [...data.board];
  newBoard[index] = playerSymbol;

  const gameRef = db.ref(`/games/${gameId}`);
  const winner = getWinner(newBoard);
  const draw = !newBoard.includes(null);

  if (winner) {
    gameRef.update({
      board: newBoard,
      status: "ended",
      winner: player
    });
    updatePlayerStats(player, "win");
    const opponent = playerSymbol === "X" ? data.playerO : data.playerX;
    if (opponent) updatePlayerStats(opponent, "loss");
  } else if (draw) {
    gameRef.update({
      board: newBoard,
      status: "ended",
      winner: null
    });
    updatePlayerStats(data.playerX, "draw");
    updatePlayerStats(data.playerO, "draw");
  } else {
    gameRef.update({
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

// 🔢 Player score management
function ensurePlayerStats(name) {
  const ref = db.ref(`/players/${name}`);
  ref.once('value', snapshot => {
    if (!snapshot.exists()) {
      ref.set({ wins: 0, losses: 0, draws: 0 });
    }
  });
}

function updatePlayerStats(name, result) {
  const stat = result === "win" ? "wins" : result === "loss" ? "losses" : "draws";
  const ref = db.ref(`/players/${name}/${stat}`);
  ref.transaction(current => (current || 0) + 1);
}

// 🆕 Start a new game
function startNewGame() {
  const gameRef = db.ref(`/games/${gameId}`);
  gameRef.once('value', snapshot => {
    const data = snapshot.val();
    if (data.status !== "ended") return alert("Game is still ongoing.");
    gameRef.update({
      board: Array(9).fill(null),
      turn: "X",
      status: "playing",
      winner: null
    });
  });
}
