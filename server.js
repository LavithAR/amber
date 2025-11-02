const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

// Game state (saved and live)
let gameState = {
  players: {},
  scores: {
    arabica: 0,
    robusta: 0,
    excelsa: 0,
    liberica: 0
  },
  board: [],
  currentTurn: 'arabica',
  started: false
};

// Load saved game if available
const savePath = path.join(__dirname, 'data', 'saved_game.json');
if (fs.existsSync(savePath)) {
  try {
    gameState = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    console.log("♻️ Loaded saved game data");
  } catch (err) {
    console.error("⚠️ Could not load saved game:", err);
  }
}

// Routes for main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

// Socket connections
io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  socket.on('joinTeam', (team) => {
    if (!['arabica', 'robusta', 'excelsa', 'liberica'].includes(team)) return;
    gameState.players[socket.id] = { team };
    console.log(`👥 ${socket.id} joined ${team}`);
    socket.emit('init', gameState);
    io.emit('updateScores', gameState.scores);
  });

  socket.on('playWord', (data) => {
    const player = gameState.players[socket.id];
    if (!player) return;
    const { word, points } = data;
    gameState.scores[player.team] += points;
    io.emit('wordPlayed', { team: player.team, word, points });
    io.emit('updateScores', gameState.scores);
  });

  socket.on('adminCommand', (cmd) => {
    switch (cmd) {
      case 'start': gameState.started = true; break;
      case 'pause': gameState.started = false; break;
      case 'reset':
        gameState = {
          players: {},
          scores: { arabica: 0, robusta: 0, excelsa: 0, liberica: 0 },
          board: [],
          currentTurn: 'arabica',
          started: false
        };
        break;
    }
    io.emit('adminUpdate', gameState);
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    console.log(`❌ ${socket.id} disconnected`);
  });
});

// Save game on exit
process.on('SIGINT', () => {
  fs.writeFileSync(savePath, JSON.stringify(gameState, null, 2));
  console.log("\n💾 Game state saved.");
  process.exit();
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
