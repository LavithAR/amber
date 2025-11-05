// client-js/display.js
const socket = io();

socket.on('state', state => {
  const teams = state.teams || {};
  for (const team of ['arabica','robusta','excelsa','liberica']) {
    const el = document.getElementById(`${team}Score`);
    if (el) el.textContent = teams[team]?.score ?? 0;
  }
});
