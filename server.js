const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DICTIONARY_PATH = path.join(__dirname, "public", "dictionary.txt");
let dictionary = new Set();
if (fs.existsSync(DICTIONARY_PATH)) {
  dictionary = new Set(
    fs.readFileSync(DICTIONARY_PATH, "utf-8")
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0)
  );
  console.log(`✅ Dictionary loaded with ${dictionary.size} words`);
}

// ROUTES
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "display.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/play", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "play.html"));
});

app.get("/display", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "display.html"));
});

app.get("/validate/:word", (req, res) => {
  const word = req.params.word.toLowerCase();
  res.json({ valid: dictionary.has(word) });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
