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

let board = Array(9).fill("");
let currentPlayer = "X";
let isGameActive = false;

const winCombos = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function startGame() {
  isGameActive = true;
  board = Array(9).fill("");
  currentPlayer = "X";
  document.getElementById("game-board").style.display = "block";
  document.getElementById("status").innerText = "Player X's Turn";
  drawBoard();
}

function endGame() {
  isGameActive = false;
  document.getElementById("game-board").style.display = "none";
}

function drawBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  board.forEach((cell, idx) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.innerText = cell;
    div.onclick = () => makeMove(idx);
    boardEl.appendChild(div);
  });
}

function makeMove(idx) {
  if (!isGameActive || board[idx] !== "") return;
  board[idx] = currentPlayer;
  drawBoard();
  if (checkWin(currentPlayer)) {
    document.getElementById("status").innerText = `Player ${currentPlayer} Wins!`;
    saveScore(currentPlayer);
    isGameActive = false;
  } else if (!board.includes("")) {
    document.getElementById("status").innerText = "Draw!";
    isGameActive = false;
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    document.getElementById("status").innerText = `Player ${currentPlayer}'s Turn`;
  }
}

function checkWin(player) {
  return winCombos.some(combo => combo.every(i => board[i] === player));
}

function saveScore(winner) {
  const newScore = {
    player: winner,
    timestamp: Date.now()
  };
  db.ref('scores').push(newScore);
  loadScores();
}

function loadScores() {
  db.ref('scores')
    .orderByChild('timestamp')
    .limitToLast(5)
    .once('value', (snapshot) => {
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
