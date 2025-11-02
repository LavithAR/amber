const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Routes for HTML pages
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

// Fallback route (for “Not Found” errors)
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
