const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("Token loaded:", !!process.env.API_TOKEN);

const express = require("express");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/", routes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});