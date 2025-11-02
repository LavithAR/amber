const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// --- ROUTES ---
app.get("/", (req, res) => res.redirect("/display.html"));
app.get("/play", (req, res) => res.sendFile(path.join(__dirname, "public", "play.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/display", (req, res) => res.sendFile(path.join(__dirname, "public", "display.html")));

// --- GAME STATE ---
let gameData = {
  turn: "arabica",
  scores: { arabica: 0, robusta: 0, excelsa: 0, liberica: 0 },
  board: Array(15).fill(null).map(() => Array(15).fill("")),
  tiles: {}
};

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
  console.log("New connection");

  // Send current game state to new client
  socket.emit("update", gameData);

  socket.on("playWord", (data) => {
    const { team, word } = data;
    console.log(`${team} played ${word}`);
    gameData.scores[team] += word.length * 5; // simple scoring
    gameData.turn = nextTeam(team);
    io.emit("update", gameData);
  });

  socket.on("resetGame", () => {
    gameData = {
      turn: "arabica",
      scores: { arabica: 0, robusta: 0, excelsa: 0, liberica: 0 },
      board: Array(15).fill(null).map(() => Array(15).fill("")),
      tiles: {}
    };
    io.emit("update", gameData);
  });
});

function nextTeam(current) {
  const teams = ["arabica", "robusta", "excelsa", "liberica"];
  const nextIndex = (teams.indexOf(current) + 1) % teams.length;
  return teams[nextIndex];
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
