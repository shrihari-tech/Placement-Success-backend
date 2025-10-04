//backend/Placement-Success-backend/index.js
const express = require("express");
const port = 5000;
const app = express();
const pool = require('./db.js');
const batches = require('./routes/Batches.js')
const students = require('./routes/Students.js')
const opportunities = require('./routes/Oppotunities.js')
const scores = require('./routes/Scores.js')
const owner = require('./routes/Owner.js')
const domains = require('./routes/Domain.js')
const teamLeader = require('./routes/TeamLeader.js')
const user = require('./routes/User.js')
const epic = require('./routes/EPIC.js')
const eligibilityStatus = require('./routes/EligibilityStatus.js')
const batch_status = require('./routes/Batch_Status.js')
const users = require('./routes/Users.js')
const spocs = require('./routes/Spoc.js')
const cors = require("cors");
app.use(cors());

app.listen(port, () => {
  console.log(`Backend running on ${port}`);
});
app.use(express.json({limit:"50mb"}));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

if (pool) {
  console.log("Database connected");
}

app.use("/batches", batches);
app.use("/domain",domains);
app.use("/eligibilityStatus",eligibilityStatus);
app.use("/epic",epic);
app.use("/spocs",spocs);
app.use("/user",user);
app.use("/students", students);
app.use("/opportunities", opportunities);
app.use("/scores", scores);
app.use("/teamLeader", teamLeader);
app.use("/owner", owner);
app.use("/batch_status", batch_status);
app.use("/users", users);
