document.addEventListener("DOMContentLoaded", () => {
  const scores = {
    arabica: 0,
    robusta: 0,
    excelsa: 0,
    liberica: 0,
  };

  const updateScoreboard = () => {
    for (let team in scores) {
      document.getElementById(`${team}Score`).textContent = scores[team];
    }
    localStorage.setItem("scrabbleScores", JSON.stringify(scores));
  };

  const saved = localStorage.getItem("scrabbleScores");
  if (saved) Object.assign(scores, JSON.parse(saved));
  updateScoreboard();

  document.getElementById("startGame").addEventListener("click", () => {
    alert("Game started! All players can now play.");
  });

  document.getElementById("pauseGame").addEventListener("click", () => {
    alert("Game paused or resumed!");
  });

  document.getElementById("nextRound").addEventListener("click", () => {
    alert("Next round starting!");
  });

  document.getElementById("resetGame").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all scores?")) {
      for (let t in scores) scores[t] = 0;
      updateScoreboard();
      alert("Game reset!");
    }
  });
});
