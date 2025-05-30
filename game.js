// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDL_gFAjzDYn7UT4OMO8RBQtEE1cXgAWRM",
  authDomain: "tictactoe-81cd5.firebaseapp.com",
  databaseURL: "https://tictactoe-81cd5-default-rtdb.firebaseio.com",
  projectId: "tictactoe-81cd5",
  storageBucket: "tictactoe-81cd5.firebasestorage.app",
  messagingSenderId: "31391867375",
  appId: "1:31391867375:web:886a9ee074d1900ea5161a",
  measurementId: "G-D9Y070WG70"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// GAME STATE
let playerSymbol = "";
let gameId = "";
let isMyTurn = false;

// UI Hooks
const statusEl = document.getElementById("status");
const boardEl = document.getElementById("board");
const code = document.getElementById("code");

// Create New Game
function startGame() {
  gameId = db.ref("games").push().key;
  db.ref("games/" + gameId).set({
    board: Array(9).fill(""),
    playerX: "Player_" + Date.now(),
    currentTurn: "X",
    isActive: true,
    winner: ""
  });
  playerSymbol = "X";
  isMyTurn = true;
  listenToGame();
  document.getElementById("game-board").style.display = "block";
   code.innerText = gameId;
}

// Join Existing Game
function joinGame(gameIdToJoin) {
  gameId = gameIdToJoin;
  db.ref("games/" + gameId).once("value", snapshot => {
    const data = snapshot.val();
    if (data && !data.playerO) {
      db.ref("games/" + gameId).update({ playerO: "Player_" + Date.now() });
      playerSymbol = "O";
      isMyTurn = false;
      listenToGame();
      document.getElementById("game-board").style.display = "block";
    } else {
      alert("Game not found or already full.");
    }
  });
}

// Listen to game state changes
function listenToGame() {
  db.ref("games/" + gameId).on("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;
    updateBoard(data.board);
    statusEl.innerText = data.winner
      ? (data.winner === "Draw" ? "It's a draw!" : `Player ${data.winner} wins!`)
      : (data.currentTurn === playerSymbol ? "Your turn" : "Opponent's turn");
    isMyTurn = data.currentTurn === playerSymbol;
  });
}

// Make a move
function makeMove(idx) {
  if (!isMyTurn) return;
  db.ref("games/" + gameId).once("value", snapshot => {
    const data = snapshot.val();
    if (!data || data.board[idx] || data.winner) return;

    const board = data.board;
    board[idx] = playerSymbol;

    const winner = checkWinner(board);
    db.ref("games/" + gameId).update({
      board: board,
      currentTurn: playerSymbol === "X" ? "O" : "X",
      winner: winner,
      isActive: winner ? false : true
    });

    if (winner && winner !== "Draw") saveScore(playerSymbol);
  });
}

// Update UI board
function updateBoard(board) {
  boardEl.innerHTML = "";
  board.forEach((cell, idx) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.innerText = cell;
    div.onclick = () => makeMove(idx);
    boardEl.appendChild(div);
  });
}

// Check Winner Logic
function checkWinner(b) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let combo of combos) {
    const [a, b1, c] = combo;
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  }
  return b.includes("") ? "" : "Draw";
}

// Save score
function saveScore(winner) {
  db.ref('scores').push({
    player: winner,
    timestamp: Date.now()
  });
  loadScores();
}

// Load leaderboard
function loadScores() {
  db.ref('scores')
    .orderByChild('timestamp')
    .limitToLast(5)
    .once('value', snapshot => {
      const scoreList = document.getElementById("scoreList");
      scoreList.innerHTML = "";
      const scores = [];
      snapshot.forEach(child => scores.push(child.val()));
      scores.reverse().forEach(score => {
        const li = document.createElement("li");
        const date = new Date(score.timestamp).toLocaleString();
        li.innerText = `Player ${score.player} - ${date}`;
        scoreList.appendChild(li);
      });
    });
}

window.onload = loadScores;
