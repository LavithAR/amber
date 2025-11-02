// ================================
// AMBER SCRABBLE INTERHOUSE SERVER
// ================================

const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 10000;
const DICTIONARY_PATH = path.join(__dirname, "dictionary.txt");

// Load dictionary
let dictionary = new Set();
try {
  const words = fs.readFileSync(DICTIONARY_PATH, "utf-8").split(/\r?\n/);
  words.forEach(w => dictionary.add(w.trim().toUpperCase()));
  console.log(`✅ Dictionary loaded: ${dictionary.size} words`);
} catch (err) {
  console.error("❌ Error loading dictionary:", err);
}

// Serve static frontend
app.use(express.static(path.join(__dirname, "client")));

// Fallback to index.html for frontend routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

// Player and game state
let players = {};
let currentTurn = 0;
let playerOrder = [];

io.on("connection", (socket) => {
  console.log("🟢 Player connected:", socket.id);

  socket.on("joinGame", (name) => {
    if (!players[socket.id]) {
      players[socket.id] = { name, score: 0 };
      playerOrder.push(socket.id);
    }
    io.emit("updatePlayers", Object.values(players));
  });

  socket.on("wordPlayed", (word) => {
    const valid = dictionary.has(word.toUpperCase());
    if (valid) {
      players[socket.id].score += word.length * 10;
      io.emit("message", `${players[socket.id].name} played '${word}' ✅`);
    } else {
      io.emit("message", `${players[socket.id].name} tried '${word}' ❌`);
    }
    io.emit("updatePlayers", Object.values(players));
  });

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected:", socket.id);
    delete players[socket.id];
    playerOrder = playerOrder.filter(id => id !== socket.id);
    io.emit("updatePlayers", Object.values(players));
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

