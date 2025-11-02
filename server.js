const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

let players = {};
let board = Array(15)
  .fill(null)
  .map(() => Array(15).fill(""));
let scores = {
  Arabica: 0,
  Robusta: 0,
  Excelsa: 0,
  Liberica: 0
};

const dictionary = new Set(
  fs
    .readFileSync(path.join(__dirname, "dictionary.txt"), "utf8")
    .split(/\r?\n/)
    .map((w) => w.trim().toUpperCase())
);

io.on("connection", (socket) => {
  socket.on("join", (team) => {
    players[socket.id] = team;
    io.emit("updateScores", scores);
  });

  socket.on("placeWord", ({ word, x, y, direction }) => {
    const team = players[socket.id];
    if (!team) return;

    if (!dictionary.has(word.toUpperCase())) {
      socket.emit("invalidWord", word);
      return;
    }

    for (let i = 0; i < word.length; i++) {
      const letter = word[i].toUpperCase();
      if (direction === "across") board[y][x + i] = letter;
      else board[y + i][x] = letter;
    }

    let score = word.length * 2;
    scores[team] += score;

    io.emit("updateBoard", board);
    io.emit("updateScores", scores);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

http.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 10000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, "client")));

// Fallback route for index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

});

