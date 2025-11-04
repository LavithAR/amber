// admin.js
const socket = io();
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const nextBtn = document.getElementById('nextBtn');
const resetBtn = document.getElementById('resetBtn');
const movesLog = document.getElementById('movesLog');

startBtn.onclick = ()=> socket.emit('admin:command','start');
pauseBtn.onclick = ()=> socket.emit('admin:command','pause');
nextBtn.onclick = ()=> socket.emit('admin:command','next');
resetBtn.onclick = ()=> {
  if (confirm('Reset game?')) socket.emit('admin:command','reset');
};

socket.on('state', s => {
  document.getElementById('score-arabica').innerText = s.scores.arabica || 0;
  document.getElementById('score-robusta').innerText = s.scores.robusta || 0;
  document.getElementById('score-excelsa').innerText = s.scores.excelsa || 0;
  document.getElementById('score-liberica').innerText = s.scores.liberica || 0;
  document.getElementById('currentTurn').innerText = (s.teamsOrder && s.teamsOrder[s.currentTeamIndex]) || '--';
  // moves
  movesLog.innerHTML = '';
  (s.moves || []).forEach(m => {
    const p = document.createElement('div');
    p.innerText = `${m.team.toUpperCase()} — ${m.word} (+${m.points}) by ${m.by}`;
    movesLog.appendChild(p);
  });
});

socket.on('played', move => {
  // prepend latest move visually
  const p = document.createElement('div');
  p.innerText = `${move.team.toUpperCase()} — ${move.word} (+${move.points}) by ${move.by}`;
  movesLog.prepend(p);
});
