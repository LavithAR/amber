document.addEventListener("DOMContentLoaded", () => {
  const update = () => {
    const saved = localStorage.getItem("scrabbleScores");
    if (!saved) return;
    const scores = JSON.parse(saved);
    for (let t in scores) {
      const el = document.getElementById(`score-${t}`);
      if (el) el.textContent = scores[t];
    }
  };

  update();
  setInterval(update, 2000); // refresh every 2 seconds
});
