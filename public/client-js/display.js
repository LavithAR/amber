// display.js
const socket = io();
const boardEl = document.getElementById('board');
const recent = document.getElementById('recent');

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

socket.on('state', s => {
  renderBoard(s.board || []);
  document.getElementById('score-arabica').innerText = s.scores.arabica || 0;
  document.getElementById('score-robusta').innerText = s.scores.robusta || 0;
  document.getElementById('score-excelsa').innerText = s.scores.excelsa || 0;
  document.getElementById('score-liberica').innerText = s.scores.liberica || 0;
  document.getElementById('currentTurn').innerText = (s.teamsOrder && s.teamsOrder[s.currentTeamIndex]) || '--';
  recent.innerHTML = '';
  (s.moves || []).slice(0,10).forEach(m => {
    const el = document.createElement('div');
    el.innerText = `${m.team.toUpperCase()} — ${m.word} (+${m.points})`;
    recent.appendChild(el);
  });
});

socket.on('played', m => {
  // prepend
  const el = document.createElement('div');
  el.innerText = `${m.team.toUpperCase()} — ${m.word} (+${m.points})`;
  recent.prepend(el);
});
