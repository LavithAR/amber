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
  for (let r=0;r<15;r++){
    for (let c=0;c<15;c++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (r===7 && c===7) { cell.classList.add('center'); cell.innerText = '★'; }
      const letter = grid?.[r]?.[c] || '';
      if (letter) cell.innerText = letter;
      boardEl.appendChild(cell);
    }
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
