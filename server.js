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

// --- dictionary load (try public/dictionary.txt then root/dictionary.txt) ---
let dictionary = new Set();
function loadDictionary() {
  try {
    const dictPath = fs.existsSync(DICT_FILE_PUBLIC) ? DICT_FILE_PUBLIC : (fs.existsSync(DICT_FILE_ROOT) ? DICT_FILE_ROOT : null);
    if (dictPath) {
      const text = fs.readFileSync(dictPath, 'utf8');
      text.split(/\r?\n/).forEach(w => {
        if (w && w.trim()) dictionary.add(w.trim().toLowerCase());
      });
      console.log(`✅ Dictionary loaded (${dictionary.size} words) from ${dictPath}`);
    } else {
      // fallback tiny dictionary
      const fallback = ['about','above','after','again','animal','answer','board','break','bring','child','clean','close','color','country','create','dance','drink','drive','family','friend','house','light','money','music','people','place','point','right','school','start','state','study','table','thing','think','time','water','woman','world'];
      fallback.forEach(w => dictionary.add(w));
      console.log(`⚠️ No dictionary.txt found — using small fallback dictionary (${dictionary.size} words). To use full dictionary download words_alpha and save as dictionary.txt in project root or public/`);
    }
  } catch (e) {
    console.error('Error loading dictionary:', e);
  }
}
loadDictionary();

// --- Scrabble helper values (basic letter values) ---
const LETTER_VALUES = {
  a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,
  n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10
};

// Basic bonus map (not exhaustive) - center 7,7 is DW
const BONUS = {};
BONUS['7,7'] = 'DW';
// (You can expand BONUS for full Scrabble layout later)

// --- initial state (attempt load from save) ---
let state = {
  board: Array.from({length:15}, ()=>Array(15).fill('')),
  teamsOrder: ['arabica','robusta','excelsa','liberica'],
  scores: { arabica:0, robusta:0, excelsa:0, liberica:0 },
  currentTeamIndex: 0,
  running: false,
  moves: [] // history of moves
};

if (fs.existsSync(SAVE_FILE)) {
  try {
    const saved = fs.readJSONSync(SAVE_FILE);
    // basic merge to ensure required fields exist
    state = Object.assign(state, saved);
    if (!state.board || state.board.length !== 15) state.board = Array.from({length:15}, ()=>Array(15).fill(''));
    console.log('♻️ Loaded saved game state');
  } catch (err) {
    console.warn('⚠ Could not parse saved_game.json, starting fresh.');
  }
}

function saveState() {
  try {
    fs.writeJSONSync(SAVE_FILE, state, {spaces:2});
  } catch (e) {
    console.error('Error saving state:', e);
  }
}
setInterval(saveState, 30*1000); // autosave every 30s

// serve static files
app.use(express.static(PUBLIC));

// routes
app.get('/', (req,res)=> res.redirect('/display'));
app.get('/admin', (req,res)=> res.sendFile(path.join(PUBLIC,'admin.html')));
app.get('/play', (req,res)=> res.sendFile(path.join(PUBLIC,'play.html')));
app.get('/display', (req,res)=> res.sendFile(path.join(PUBLIC,'display.html')));

// small API for debugging/other uses
app.get('/api/state', (req,res) => res.json(state));
app.get('/api/validate/:word', (req,res) => {
  const w = (req.params.word || '').toLowerCase();
  res.json({ valid: !!dictionary.has(w) });
});

// compute word score (simple; uses bonus map for DW/TW/DL/TL if extended)
function computeWordScore(word, row, col, direction) {
  word = word.toLowerCase();
  let total = 0;
  let wordMul = 1;
  for (let i=0;i<word.length;i++) {
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

// socket.io logic
io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
  // send current state
  socket.emit('state', state);

  // join as player (team and optional name)
  socket.on('join', ({ team, name }) => {
    socket.data.team = team;
    socket.data.name = name || team;
    socket.emit('state', state);
    io.emit('players', getPlayersList());
    console.log(`${socket.id} joined as ${team}`);
  });

  socket.on('admin:command', cmd => {
    if (cmd === 'start') {
      state.running = true;
      state.currentTeamIndex = 0;
      io.emit('state', state);
    } else if (cmd === 'pause') {
      state.running = false;
      io.emit('state', state);
    } else if (cmd === 'reset') {
      state.board = Array.from({length:15}, ()=>Array(15).fill(''));
      state.scores = { arabica:0, robusta:0, excelsa:0, liberica:0 };
      state.currentTeamIndex = 0;
      state.running = false;
      state.moves = [];
      io.emit('state', state);
      saveState();
    } else if (cmd === 'next') {
      state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teamsOrder.length;
      io.emit('state', state);
    }
  });

  // player submits a word:
  // { word: "HELLO", row: 7, col:7, direction: "across" }
  socket.on('play:word', ({ word, row, col, direction }) => {
    if (!state.running) {
      socket.emit('errorMsg', 'Game not running yet.');
      return;
    }
    const team = socket.data.team;
    const currentTeam = state.teamsOrder[state.currentTeamIndex];
    if (team !== currentTeam) {
      socket.emit('errorMsg', 'Not your team turn.');
      return;
    }
    if (!word || !word.trim()) { socket.emit('errorMsg','Empty word'); return; }
    const W = word.trim().toLowerCase();
    if (!dictionary.has(W)) {
      socket.emit('errorMsg', 'Word not in dictionary');
      return;
    }
    // bounds check
    if (direction === 'across' && (col + W.length > 15)) { socket.emit('errorMsg','Out of bounds'); return; }
    if (direction === 'down' && (row + W.length > 15)) { socket.emit('errorMsg','Out of bounds'); return; }
    // collision check
    for (let i=0;i<W.length;i++){
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      const existing = state.board[r][c];
      if (existing && existing !== W[i]) {
        socket.emit('errorMsg', 'Collision with existing tile');
        return;
      }
    }
    // place letters
    for (let i=0;i<W.length;i++){
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      state.board[r][c] = W[i].toUpperCase();
    }
    // score
    const points = computeWordScore(W, row, col, direction);
    const teamName = state.teamsOrder[state.currentTeamIndex];
    state.scores[teamName] = (state.scores[teamName] || 0) + points;
    const move = { team: teamName, word: W.toUpperCase(), row, col, direction, points, by: socket.data.name, time: Date.now() };
    state.moves.unshift(move);
    // advance turn
    state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teamsOrder.length;
    io.emit('played', move);
    io.emit('state', state);
    saveState();
  });

  socket.on('play:pass', () => {
    const team = socket.data.team;
    if (!team) return;
    if (state.teamsOrder[state.currentTeamIndex] !== team) {
      socket.emit('errorMsg', 'Not your team turn.');
      return;
    }
    state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teamsOrder.length;
    io.emit('state', state);
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    io.emit('players', getPlayersList());
  });
});

function getPlayersList() {
  // report connected clients & their team/name
  const clients = [];
  for (const [id, s] of io.of('/').sockets) {
    clients.push({ id, team: s.data.team || 'spectator', name: s.data.name || id });
  }
  return clients;
}

// start server
server.listen(PORT, ()=> {
  console.log(`🚀 Server running on port ${PORT}`);
});
