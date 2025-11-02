const board = document.getElementById("board");
const rack = document.getElementById("rack");
const statusDiv = document.getElementById("status");
const startBtn = document.getElementById("startBtn");

function createBoard() {
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      if (r === 7 && c === 7) {
        tile.classList.add("center");
        tile.textContent = "★";
      }
      board.appendChild(tile);
    }
  }
}

function startGame() {
  statusDiv.textContent = "Game started! Place your first word on the ★ tile.";
}

startBtn.addEventListener("click", startGame);

createBoard();
