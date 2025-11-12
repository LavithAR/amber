// play.js
const socket = io();
const url = new URL(window.location.href);
const team = (url.searchParams.get('team') || '').toLowerCase();
const validTeams = ['arabica','robusta','excelsa','liberica'];

if (!validTeams.includes(team)) {
  document.body.innerHTML = `<div style="padding:30px;text-align:center">
  <h2>Invalid or missing team</h2>
  <p>Use ?team=arabica (or robusta, excelsa, liberica)</p></div>`;
  throw new Error('invalid team');
}

document.getElementById('teamLabel').innerText = `Team: ${team.toUpperCase()}`;
document.getElementById('title').innerText = `AMBER SCRABBLE — ${team.toUpperCase()}`;

const boardEl = document.getElementById('board');
const rackEl = document.getElementById('rack');
const wordInput = document.getElementById('wordInput');
const rowInput = document.getElementById('rowInput');
const colInput = document.getElementById('colInput');
const dirInput = document.getElementById('dirInput');
const msg = document.getElementById('message');

// --- BONUS MAP for visual layout (Amber Royal)
const bonusMap = [
  "TW . . DL . . . TW . . . DL . . TW",
  ". DW . . . TL . . . TL . . . DW .",
  ". . DW . . . DL . DL . . . DW . .",
  "DL . . DW . . . DL . . . DW . . DL",
  ". . . . DW . . . . . DW . . . .",
  ". TL . . . TL . . . TL . . . TL .",
  ". . DL . . . DL . DL . . . DL . .",
  "TW . . DL . . . ⭐ . . . DL . . TW",
  ". . DL . . . DL . DL . . . DL . .",
  ". TL . . . TL . . . TL . . . TL .",
  ". . . . DW . . . . . DW . . . .",
  "DL . . DW . . . DL . . . DW . . DL",
  ". . DW . . . DL . DL . . . DW . .",
  ". DW . . . TL . . . TL . . . DW .",
  "TW . . DL . . . TW . . . DL . . TW"
].map(r => r.split(" "));

// --- RENDER BOARD with labels + bonuses
function renderBoard(grid) {
  boardEl.innerHTML = '';

  // Top row — column numbers (0–14)
  const topRow = document.createElement('div');
  topRow.className = 'header-row';
  const emptyCorner = document.createElement('div');
  emptyCorner.className = 'header-cell';
  topRow.appendChild(emptyCorner);
  for (let c = 0; c < 15; c++) {
    const label = document.createElement('div');
    label.className = 'header-cell';
    label.innerText = c;
    topRow.appendChild(label);
  }
  boardEl.appendChild(topRow);

  // Main grid
  for (let r = 0; r < 15; r++) {
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'row-wrapper';

    // Row label (0–14)
    const rowLabel = document.createElement('div');
    rowLabel.className = 'header-cell';
    rowLabel.innerText = r;
    rowWrapper.appendChild(rowLabel);

    for (let c = 0; c < 15; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const bonus = bonusMap[r][c];
      let label = '';

      // --- Bonus colors & labels
      if (bonus === '⭐') {
        cell.classList.add('center');
        label = '★';
      } else if (bonus === 'TW') {
        cell.classList.add('triple-word');
        label = 'TW';
      } else if (bonus === 'DW') {
        cell.classList.add('double-word');
        label = 'DW';
      } else if (bonus === 'TL') {
        cell.classList.add('triple-letter');
        label = 'TL';
      } else if (bonus === 'DL') {
        cell.classList.add('double-letter');
        label = 'DL';
      }

      // Replace with placed letter if exists
      const letter = grid?.[r]?.[c] || '';
      if (letter) label = letter;

      cell.innerText = label;
      rowWrapper.appendChild(cell);
    }
    boardEl.appendChild(rowWrapper);
  }
}

// --- TILE RACK
let rack = [];
function fillRack() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  rack = [];
  while (rack.length < 7) {
    rack.push(letters.charAt(Math.floor(Math.random() * letters.length)));
  }
  rackEl.innerHTML = '';
  rack.forEach(l => {
    const d = document.createElement('div');
    d.className = 'tile';
    d.innerText = l;
    rackEl.appendChild(d);
  });
}
fillRack();

// --- SOCKET COMMUNICATION
socket.emit('join', { team, name: team });

socket.on('state', s => {
  renderBoard(s.board || []);
  const current = s.teamsOrder[s.currentTeamIndex];
  if (current === team) msg.innerText = `Your turn — ${current.toUpperCase()}`;
  else msg.innerText = `Waiting — current turn: ${current?.toUpperCase() || '--'}`;
});

socket.on('played', m => {
  msg.innerText = `${m.team.toUpperCase()} played ${m.word} (+${m.points})`;
  setTimeout(() => msg.innerText = '', 3500);
});

socket.on('errorMsg', m => {
  msg.innerText = 'Error: ' + m;
});

document.getElementById('submitBtn').onclick = () => {
  const word = wordInput.value.trim();
  const row = parseInt(rowInput.value);
  const col = parseInt(colInput.value);
  const dir = dirInput.value;
  if (!word) { msg.innerText = 'Enter word'; return; }
  if (isNaN(row) || isNaN(col)) { msg.innerText = 'Enter row/col'; return; }
  socket.emit('play:word', { word, row, col, direction: dir });
};

document.getElementById('passBtn').onclick = () => {
  socket.emit('play:pass');
  msg.innerText = 'Passed turn';
  setTimeout(() => msg.innerText = '', 2000);
};
