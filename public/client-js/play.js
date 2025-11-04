// play.js
const socket = io();
const url = new URL(window.location.href);
const team = (url.searchParams.get('team') || '').toLowerCase();
const validTeams = ['arabica','robusta','excelsa','liberica'];

if (!validTeams.includes(team)) {
  document.body.innerHTML = `<div style="padding:30px;text-align:center"><h2>Invalid or missing team</h2><p>Use ?team=arabica (or robusta, excelsa, liberica)</p></div>`;
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

// render empty 15x15 grid (cells are updated from state)
function renderBoard(grid) {
  boardEl.innerHTML = '';

  // Top row (empty corner + numbers 1–15)
  const topRow = document.createElement('div');
  topRow.className = 'row';
  topRow.innerHTML = `<div class="corner"></div>` +
    Array.from({ length: 15 }, (_, i) => `<div class="label top">${i + 1}</div>`).join('');
  boardEl.appendChild(topRow);

  // Rows with left numbers + cells
  for (let r = 0; r < 15; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    rowDiv.innerHTML = `<div class="label side">${r + 1}</div>` +
      Array.from({ length: 15 }, (_, c) => {
        const letter = grid?.[r]?.[c] || '';
        const center = (r === 7 && c === 7) ? 'center' : '';
        const symbol = center ? '★' : letter;
        return `<div class="cell ${center}">${symbol}</div>`;
      }).join('');
    boardEl.appendChild(rowDiv);
  }
}


// simple rack generator (random letters) for UI only
let rack = [];
function fillRack() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  while (rack.length < 7) {
    rack.push(letters.charAt(Math.floor(Math.random()*letters.length)));
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

// join server as this team
socket.emit('join', { team, name: team });

// socket events
socket.on('state', s => {
  renderBoard(s.board || []);
  // highlight current turn
  const current = s.teamsOrder[s.currentTeamIndex];
  if (current === team) msg.innerText = `Your turn — ${current.toUpperCase()}`;
  else msg.innerText = `Waiting — current turn: ${current?.toUpperCase() || '--'}`;
});

socket.on('played', m => {
  // update UI briefly
  msg.innerText = `${m.team.toUpperCase()} played ${m.word} (+${m.points})`;
  setTimeout(()=> msg.innerText = '', 3500);
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
  setTimeout(()=> msg.innerText = '', 2000);
};
