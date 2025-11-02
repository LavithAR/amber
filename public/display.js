async function fetchScores() {
  try {
    const response = await fetch("/api/scores");
    const data = await response.json();

    document.getElementById("arabica-score").innerText = data.arabica || 0;
    document.getElementById("robusta-score").innerText = data.robusta || 0;
    document.getElementById("excelsa-score").innerText = data.excelsa || 0;
    document.getElementById("liberica-score").innerText = data.liberica || 0;

    const turnText = data.currentTurn
      ? `🎯 Current Turn: ${data.currentTurn.toUpperCase()}`
      : "Waiting for game to start...";
    document.getElementById("turnDisplay").innerText = turnText;
  } catch (err) {
    console.error("Error fetching scores:", err);
  }
}

// Refresh every 2 seconds
setInterval(fetchScores, 2000);
fetchScores();
