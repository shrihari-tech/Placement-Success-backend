const router = require("express").Router();
const pool = require("../db");

// get all batches
router.get("/allBatches",async(req,res)=>{
    try{
        const [rows] = await pool.query("SELECT * FROM batches");
        res.json(rows);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:"Internal Server Error"});
    }
})

// post a batch
router.post("/addBatch",async(req,res)=>{
    try{
        const { batchName, status, mode, startDate, endDate, domain } = req.body;
        const [result] = await pool.query("INSERT INTO batches (batchName, status, mode, startDate, endDate, domain) VALUES (?, ?, ?, ?, ?, ?)",
            [batchName, status, mode, startDate, endDate, domain]
        );
        res.json({message:"Batch added successfully", batchId: result.insertId});
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:"Internal Server Error"});
    }
});

//get batch by id
router.get("/:id",async(req,res)=>{
    try{
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM batches WHERE id = ?", [id]);
        if(rows.length === 0){
            return res.status(404).json({error:"Batch not found"});
        }
        res.json(rows[0]);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:"Internal Server Error"});
    }
});

// delete a by id
router.delete("/:id",async(req,res)=>{
    try{
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM batches WHERE id = ?", [id]);
        if(result.affectedRows === 0){
            return res.status(404).json({error:"Batch not found"});
        }
        res.json({message:"Batch deleted successfully"});
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:"Internal Server Error"});
    }
});

//update a batch by id
router.put("/:id",async(req,res)=>{
    try{
        const { id } = req.params;
        const { batchName, status, mode, startDate, endDate, domain } = req.body;
        const [result] = await pool.query("UPDATE batches SET batchName = ?, status = ?, mode = ?, startDate = ?, endDate = ?, domain = ? WHERE id = ?",
            [batchName, status, mode, startDate, endDate, domain, id]
        );
        if(result.affectedRows === 0){
            return res.status(404).json({error:"Batch not found"});
        }
        res.json({message:"Batch updated successfully"});
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:"Internal Server Error"});
    }
});

//batch change
router.post("/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  const { toBatchNo, domain, reason, attachmentUrl, requestedBy } = req.body;

  try {
    // Find batchId from batchName
    const [batch] = await pool.query(
      "SELECT id FROM batches WHERE batchName = ?",
      [toBatchNo]
    );

    if (batch.length === 0) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const batchId = batch[0].id;

    // Update student's batchId
    await pool.query(
      "UPDATE students SET batchId = ? WHERE bookingId = ?",
      [batchId, bookingId]
    );

    // Record the change in batchChange table
    await pool.query(
      `INSERT INTO batch_changes (bookingId, fromBatch, toBatch, domain, reason, attachmentUrl, requestedBy) 
       VALUES (?, (SELECT batchName FROM batches b JOIN students s ON b.id = s.batchId WHERE s.bookingId = ?), ?, ?, ?, ?, ?)`,
      [bookingId, bookingId, toBatchNo, domain, reason, attachmentUrl, requestedBy]
    );

    res.json({ message: "Batch changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;