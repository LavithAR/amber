const socket = io();
const log = document.getElementById("log");

function logMessage(msg) {
  log.innerHTML += `<p>${msg}</p>`;
}

document.getElementById("startGame").onclick = () => socket.emit("resetGame");
socket.on("update", (data) => {
  document.getElementById("turn").innerText = `Turn: ${data.turn.toUpperCase()}`;
  document.getElementById("scores").innerText = JSON.stringify(data.scores, null, 2);
});
