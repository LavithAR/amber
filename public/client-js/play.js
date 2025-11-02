const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const team = urlParams.get("team") || "unknown";

const board = document.getElementById("board");
const statusDiv = document.getElementById("status");
const teamName = document.getElementById("teamName");
teamName.innerText = team.toUpperCase();

for (let r = 0; r < 15; r++) {
  for (let c = 0; c < 15; c++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    if (r === 7 && c === 7) cell.innerText = "★";
    board.appendChild(cell);
  }
}

document.getElementById("submitWord").onclick = () => {
  const randomWord = "TEST";
  socket.emit("playWord", { team, word: randomWord });
};

document.getElementById("passTurn").onclick = () => {
  statusDiv.innerText = "You passed your turn.";
};

socket.on("update", (data) => {
  statusDiv.innerText = `Current Turn: ${data.turn.toUpperCase()}\nYour Score: ${data.scores[team]}`;
});
