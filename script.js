const socket = io();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const tileSize = 40;
let board = Array(15).fill(null).map(() => Array(15).fill(""));
let team = null;

// Draw the Scrabble board
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      ctx.strokeStyle = "#333";
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

      // Center star
      if (x === 7 && y === 7) {
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.fillText("★", x * tileSize + 10, y * tileSize + 25);
      }

      if (board[y][x] !== "") {
        ctx.fillStyle = "#222";
        ctx.font = "20px Arial";
        ctx.fillText(board[y][x], x * tileSize + 12, y * tileSize + 25);
      }
    }
  }
}

drawBoard();

// Join game
document.getElementById("joinBtn").onclick = () => {
  const select = document.getElementById("teamSelect");
  if (select.value === "") {
    alert("Please select your house first!");
    return;
  }
  team = select.value;
  socket.emit("join", team);
  alert("Joined as " + team + "!");
};

// Place word
document.getElementById("placeWordBtn").onclick = () => {
  const word = document.getElementById("word").value.trim();
  const x = parseInt(document.getElementById("x").value);
  const y = parseInt(document.getElementById("y").value);
  const direction = document.getElementById("direction").value;

  if (!team) {
    alert("Join a house first!");
    return;
  }

  if (!word || isNaN(x) || isNaN(y)) {
    alert("Please fill all fields.");
    return;
  }

  socket.emit("placeWord", { word, x, y, direction });
};

// Update board
socket.on("updateBoard", (newBoard) => {
  board = newBoard;
  drawBoard();
});

// Update scores
socket.on("updateScores", (scores) => {
  const list = document.getElementById("scoreList");
  list.innerHTML = "";
  for (const [team, score] of Object.entries(scores)) {
    const li = document.createElement("li");
    li.textContent = `${team}: ${score}`;
    list.appendChild(li);
  }
});

// Invalid word alert
socket.on("invalidWord", (word) => {
  alert(`❌ '${word}' is not in dictionary!`);
});
