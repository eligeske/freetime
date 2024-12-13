const express = require("express");
const app = express();
const path = require("path");

// Serve static files from the chrome-app directory
app.use(express.static("chrome-app"));

// Serve the main application HTML for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "chrome-app/html/application.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
