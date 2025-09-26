const express = require('express');
const port = 5000;
const app = express();
const pool = require('./db.js');
const batches = require('./routes/Batches.js')
const students = require('./routes/Students.js')
const opportunities = require('./routes/Oppotunities.js')
const scores = require('./routes/Scores.js')
const spocs = require('./routes/Spoc.js')
const domains = require('./routes/Domain.js')
const user = require('./routes/User.js')
const epic = require('./routes/EPIC.js')
const cors = require('cors');

app.use(cors());
app.listen(port,()=>{
    console.log(`Backend running on ${port}`);
})
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello World!");
});

if(pool){
    console.log("Database connected");
}

app.use("/batches",batches);
app.use("/students",students);
app.use("/opportunities",opportunities);
app.use("/scores",scores);
app.use("/spocs",spocs);
app.use("/domain",domains);
app.use("/user",user);
app.use("/epic",epic);
