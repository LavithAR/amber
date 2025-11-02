const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// 🧭 Admin route
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// 🎮 Player route (with team query)
app.get("/play", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "play.html"));
});

// 🖥️ Display route
app.get("/display", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "display.html"));
});

// Root redirect to display
app.get("/", (req, res) => {
  res.redirect("/display");
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
