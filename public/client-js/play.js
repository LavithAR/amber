document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const team = urlParams.get("team");
  if (!team) {
    document.body.innerHTML = "<h2>Invalid team link!</h2>";
    return;
  }

  const teamColors = {
    arabica: "blue",
    robusta: "orange",
    excelsa: "green",
    liberica: "red",
  };

  document.body.style.borderTop = `8px solid ${teamColors[team]}`;
  document.getElementById("teamName").innerHTML = `${team.toUpperCase()} 🟩`;
  const rackDiv = document.getElementById("rack");
  const msgDiv = document.getElementById("message");

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const rack = Array.from({ length: 7 }, () =>
    letters.charAt(Math.floor(Math.random() * letters.length))
  );

  rackDiv.textContent = rack.join(" ");

  document.getElementById("submitWord").addEventListener("click", async () => {
    const word = prompt("Enter your word:").trim().toLowerCase();
    if (!word) return;

    const res = await fetch(`/validate/${word}`);
    const data = await res.json();
    if (data.valid) {
      msgDiv.textContent = `✅ "${word.toUpperCase()}" accepted! +${word.length} points`;
      let scores = JSON.parse(localStorage.getItem("scrabbleScores") || "{}");
      scores[team] = (scores[team] || 0) + word.length;
      localStorage.setItem("scrabbleScores", JSON.stringify(scores));
    } else {
      msgDiv.textContent = `❌ "${word.toUpperCase()}" is invalid!`;
    }
  });

  document.getElementById("passTurn").addEventListener("click", () => {
    msgDiv.textContent = "Turn passed.";
  });
});
