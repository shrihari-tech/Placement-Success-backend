//backend/Placement-Success-backend/index.js
const express = require("express");
const port = 5000;
const app = express();
const pool = require("./db.js");
const batches = require("./routes/Batches.js");
const students = require("./routes/Students.js");
const opportunities = require("./routes/Oppotunities.js");
const scores = require("./routes/Scores.js");
const teamLeader = require("./routes/TeamLeader.js");
const owner = require("./routes/owner.js");
const cors = require("cors");
app.use(cors());
app.listen(port, () => {
  console.log(`Backend running on ${port}`);
});
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

if (pool) {
  console.log("Database connected");
}

app.use("/batches", batches);
app.use("/students", students);
app.use("/opportunities", opportunities);
app.use("/scores", scores);
app.use("/teamLeader", teamLeader);
app.use("/owner", owner);
