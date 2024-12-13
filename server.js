const express = require("express");
const app = express();
const path = require("path");

// Serve static files from the chrome-app directory
app.use(express.static(path.join(__dirname, "./")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
