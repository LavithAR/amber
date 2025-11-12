// server.js - Amber Scrabble Interhouse (Socket.IO)
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;
const PUBLIC = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const SAVE_FILE = path.join(DATA_DIR, 'saved_game.json');
const DICT_FILE_ROOT = path.join(__dirname, 'dictionary.txt');
const DICT_FILE_PUBLIC = path.join(PUBLIC, 'dictionary.txt');

// ensure data dir
fs.ensureDirSync(DATA_DIR);

// --- dictionary load ---
let dictionary = new Set();
function loadDictionary() {
  try {
    const dictPath = fs.existsSync(DICT_FILE_PUBLIC)
      ? DICT_FILE_PUBLIC
      : (fs.existsSync(DICT_FILE_ROOT) ? DICT_FILE_ROOT : null);

    if (dictPath) {
      const text = fs.readFileSync(dictPath, 'utf8');
      text.split(/\r?\n/).forEach(w => {
        if (w && w.trim()) dictionary.add(w.trim().toLowerCase());
      });
      console.log(`✅ Dictionary loaded (${dictionary.size} words) from ${dictPath}`);
    } else {
      const fallback = [
        'about','above','after','again','animal','answer','board','break','bring',
        'child','clean','close','color','country','create','dance','drink','drive',
        'family','friend','house','light','money','music','people','place','point',
        'right','school','start','state','study','table','thing','think','time',
        'water','woman','world'
      ];
      fallback.forEach(w => dictionary.add(w));
      console.log(`⚠️ No dictionary found — using fallback (${dictionary.size} words)`);
    }
  } catch (e) {
    console.error('Error loading dictionary:', e);
  }
}
loadDictionary();

// --- initial state ---
let state = {
  board: Array.from({ length: 15 }, () => Array(15).fill('')),
  teamsOrder: ['arabica', 'robusta', 'excelsa', 'liberica'],
  scores: { arabica: 0, robusta: 0, excelsa: 0, liberica: 0 },
  currentTeamIndex: 0,
  running: false,
  moves: []
};

const SAVE_PATH = path.join(DATA_DIR, 'saved_game.json');
if (fs.existsSync(SAVE_PATH)) {
  try {
    const saved = fs.readJSONSync(SAVE_PATH);
    state = Object.assign(state, saved);
    if (!state.board || state.board.length !== 15)
      state.board = Array.from({ length: 15 }, () => Array(15).fill(''));
    console.log('♻️ Loaded saved game');
  } catch {
    console.warn('⚠️ Could not load saved game, starting fresh.');
  }
}
function saveState() {
  try {
    fs.writeJSONSync(SAVE_PATH, state, { spaces: 2 });
  } catch (e) {
    console.error('Save failed:', e);
  }
}
setInterval(saveState, 30000);

// serve static files
app.use(express.static(PUBLIC));

// routes
app.get('/', (req, res) => res.redirect('/display'));
app.get('/admin', (req, res) => res.sendFile(path.join(PUBLIC, 'admin.html')));
app.get('/play', (req, res) => res.sendFile(path.join(PUBLIC, 'play.html')));
app.get('/display', (req, res) => res.sendFile(path.join(PUBLIC, 'display.html')));

// small APIs
app.get('/api/state', (req, res) => res.json(state));
app.get('/api/validate/:word', (req, res) => {
  const w = (req.params.word || '').toLowerCase();
  res.json({ valid: !!dictionary.has(w) });
});

// --- scoring ---
function computeWordScore(word, row, col, direction) {
  word = word.toLowerCase();
  let total = 0, wordMul = 1;
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'down' ? row + i : row;
    const c = direction === 'across' ? col + i : col;
    const letter = word[i];
    let letterScore = LETTER_VALUES[letter] || 0;
    const bonus = BONUS[`${r},${c}`];
    if (bonus === 'DL') letterScore *= 2;
    if (bonus === 'TL') letterScore *= 3;
    if (bonus === 'DW') wordMul *= 2;
    if (bonus === 'TW') wordMul *= 3;
    total += letterScore;
  }
  return total * wordMul;
}

const LETTER_VALUES = {
  a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8,
  k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1,
  u: 1, v: 4, w: 4, x: 8, y: 4, z: 10
};

const BONUS = {
  "0,0": "TW", "0,7": "TW", "0,14": "TW",
  "1,1": "DW", "1,13": "DW",
  "2,2": "DW", "2,12": "DW",
  "3,3": "DW", "3,11": "DW",
  "4,4": "DW", "4,10": "DW",
  "5,5": "TL", "5,9": "TL",
  "6,6": "DL", "6,8": "DL",
  "7,0": "TW", "7,3": "DL", "7,7": "⭐", "7,11": "DL", "7,14": "TW",
  "8,6": "DL", "8,8": "DL",
  "9,5": "TL", "9,9": "TL",
  "10,4": "DW", "10,10": "DW",
  "11,3": "DW", "11,11": "DW",
  "12,2": "DW", "12,12": "DW",
  "13,1": "DW", "13,13": "DW",
  "14,0": "TW", "14,7": "TW", "14,14": "TW"
};

// --- socket logic ---
io.on('connection', socket => {
  console.log('🧩 Connected:', socket.id);
  socket.emit('state', state);

  socket.on('join', ({ team, name }) => {
    socket.data.team = team;
    socket.data.name = name || team;
    socket.emit('state', state);
    io.emit('players', getPlayers());
  });

  socket.on('admin:command', cmd => {
    if (cmd === 'start') {
      state.running = true;
      state.currentTeamIndex = 0;
    } else if (cmd === 'pause') {
      state.running = false;
    } else if (cmd === 'reset') {
      state = {
        board: Array.from({ length: 15 }, () => Array(15).fill('')),
        teamsOrder: ['arabica', 'robusta', 'excelsa', 'liberica'],
        scores: { arabica: 0, robusta: 0, excelsa: 0, liberica: 0 },
        currentTeamIndex: 0,
        running: false,
        moves: []
      };
    } else if (cmd === 'next') {
      state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teamsOrder.length;
    }
    io.emit('state', state);
    saveState();
  });

  // --- Word play handler (fixed for Scrabble-style building) ---
  socket.on('play:word', ({ word, row, col, direction }) => {
    if (!state.running) return socket.emit('errorMsg', 'Game not started');
    const team = socket.data.team;
    const currentTeam = state.teamsOrder[state.currentTeamIndex];
    if (team !== currentTeam) return socket.emit('errorMsg', 'Not your turn');

    const W = (word || '').trim().toLowerCase();
    if (!W) return socket.emit('errorMsg', 'Empty word');
    if (!dictionary.has(W)) return socket.emit('errorMsg', 'Word not found');

    if (direction === 'across' && col + W.length > 15)
      return socket.emit('errorMsg', 'Out of bounds');
    if (direction === 'down' && row + W.length > 15)
      return socket.emit('errorMsg', 'Out of bounds');

    // ✅ allow connecting words (no blocking)
    for (let i = 0; i < W.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      const existing = state.board[r][c];
      const letter = W[i].toUpperCase();
      if (existing && existing !== letter) {
        socket.emit('errorMsg', `Collision at (${r},${c})`);
        return;
      }
    }

    // ✅ place new letters only on empty squares
    for (let i = 0; i < W.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      if (!state.board[r][c]) state.board[r][c] = W[i].toUpperCase();
    }

    const points = computeWordScore(W, row, col, direction);
    const teamName = state.teamsOrder[state.currentTeamIndex];
    state.scores[teamName] += points;
    const move = { team: teamName, word: W.toUpperCase(), row, col, direction, points, time: Date.now() };
    state.moves.unshift(move);

    state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teamsOrder.length;
    io.emit('played', move);
    io.emit('state', state);
    saveState();
  });

  socket.on('play:pass', () => {
    const t = socket.data.team;
    if (t && state.teamsOrder[state.currentTeamIndex] === t) {
      state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teamsOrder.length;
      io.emit('state', state);
    }
  });

  socket.on('disconnect', () => io.emit('players', getPlayers()));
});

function getPlayers() {
  const clients = [];
  for (const [id, s] of io.of('/').sockets)
    clients.push({ id, team: s.data.team || 'spectator', name: s.data.name || id });
  return clients;
}

// start
server.listen(PORT, () => console.log(`🚀 Amber Scrabble running on port ${PORT}`));
