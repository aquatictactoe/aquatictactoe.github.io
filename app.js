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
const db = firebase.firestore();

let player = null;
let playerSymbol = null;
let unsubscribe = null;
const gameId = "multiplayer-tictactoe";

async function joinGame() {
  player = document.getElementById("playerName").value.trim();
  if (!player) return alert("Enter a name");

  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();

  let gameData = gameDoc.exists ? gameDoc.data() : null;

  if (!gameDoc.exists || !gameData.playerX) {
    await gameRef.set({
      board: Array(9).fill(null),
      turn: "X",
      playerX: player,
      playerO: null,
      xWins: 0,
      oWins: 0,
      draws: 0
    });
    playerSymbol = "X";
  } else if (!gameData.playerO && gameData.playerX !== player) {
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
    updateScores(data);
    checkWinner(data);
  });
}

function renderBoard(data) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  data.board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.textContent = cell || "";
    if (!cell && data.turn === playerSymbol) {
      div.addEventListener("click", () => makeMove(i, data));
    }
    board.appendChild(div);
  });
  document.getElementById("gameStatus").textContent = `Turn: ${data.turn}`;
}

function makeMove(index, data) {
  if (data.board[index]) return;

  const newBoard = [...data.board];
  newBoard[index] = playerSymbol;

  const winner = getWinner(newBoard);
  const draw = !newBoard.includes(null);

  const updates = {
    board: newBoard,
    turn: playerSymbol === "X" ? "O" : "X"
  };

  if (winner) {
    updates[`${playerSymbol.toLowerCase()}Wins`] = data[`${playerSymbol.toLowerCase()}Wins`] + 1;
    updates.board = Array(9).fill(null);
  } else if (draw) {
    updates.draws = data.draws + 1;
    updates.board = Array(9).fill(null);
  }

  db.collection("games").doc(gameId).update(updates);
}

function getWinner(board) {
  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winCombos.find(([a, b, c]) =>
    board[a] && board[a] === board[b] && board[a] === board[c]
  ) ? true : false;
}

function updateScores(data) {
  document.getElementById("xWins").textContent = data.xWins;
  document.getElementById("oWins").textContent = data.oWins;
  document.getElementById("draws").textContent = data.draws;
}

function checkWinner(data) {
  // Optional: Display a message if a winner was just declared.
}
