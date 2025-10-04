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
// router.post("/addBatch",async(req,res)=>{
//     try{
//         const { batchName, status, mode, startDate, endDate, domain } = req.body;
//         const [result] = await pool.query("INSERT INTO batches (batchName,  status, mode, start_date, end_date, domain) VALUES (?, ?, ?, ?, ?, ?)",
//             [batchName, status, mode, startDate, endDate, domain]
//         );
//         res.json({message:"Batch added successfully", batchId: result.insertId});
//     }
//     catch(err){
//         console.error(err);
//         res.status(500).json({error:"Internal Server Error"});
//     }
// });

// ...existing code...
// ...existing code...
router.post("/addBatch", async (req, res) => {
    try {
        const {
            batch_no,
            batchName,
            status,
            mode,
            start_date,
            end_date,
            domain,
            sections,
            trainer_name,
            total_count
        } = req.body;
        const [result] = await pool.query(
            `INSERT INTO batches 
            (batch_no, batchName, status, mode, start_date, end_date, domain, sections, trainer_name, total_count) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [batch_no, batchName, status, mode, start_date, end_date, domain, sections, trainer_name, total_count]
        );
        res.json({ message: "Batch added successfully", batchId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// ...existing code...

//get batch by id
// router.get("/:id",async(req,res)=>{
//     try{
//         const { id } = req.params;
//         const [rows] = await pool.query("SELECT * FROM batches WHERE batch_no = ?", [id]);
//         if(rows.length === 0){
//             return res.status(404).json({error:"Batch not found"});
//         }
//         res.json(rows[0]);
//     }
//     catch(err){
//         console.error(err);
//         res.status(500).json({error:"Internal Server Error"});
//     }
// });

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get the batch info (epic, batch_no, etc.)
    const [batchRows] = await pool.query(
      "SELECT * FROM batches WHERE id = ?",
      [id]
    );

    if (batchRows.length === 0) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const batch = batchRows[0];

    // 2. Get the related students for this batch_no
    const [studentRows] = await pool.query(
      "SELECT * FROM students WHERE batch_no = ?",
      [batch.batch_no]
    );

    // 3. Combine both
    res.json({
      batch,
      students: studentRows,
    });
  } catch (err) {
    console.error("Batch Fetch Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
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
// router.put("/:id",async(req,res)=>{
//     try{
//         const { id } = req.params;
//         const { batchName, status, mode, startDate, endDate, domain } = req.body;
//         const [result] = await pool.query("UPDATE batches SET batchName = ?, status = ?, mode = ?, startDate = ?, endDate = ?, domain = ? WHERE id = ?",
//             [batchName, status, mode, startDate, endDate, domain, id]
//         );
//         if(result.affectedRows === 0){
//             return res.status(404).json({error:"Batch not found"});
//         }
//         res.json({message:"Batch updated successfully"});
//     }
//     catch(err){
//         console.error(err);
//         res.status(500).json({error:"Internal Server Error"});
//     }
// });
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      batchName, 
      status, 
      mode, 
      startDate, 
      endDate, 
      domain, 
      trainer, 
      startTime, 
      endTime 
    } = req.body;

    const [result] = await pool.query(
      `UPDATE batches 
       SET batchName = ?, status = ?, mode = ?, startDate = ?, endDate = ?, 
           domain = ?, trainer = ?, startTime = ?, endTime = ? 
       WHERE id = ?`,
      [batchName, status, mode, startDate, endDate, domain, trainer, startTime, endTime, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({ message: "Batch updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
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



// GET /batches/totalBatches → get total batches count per domain
// GET /batches/totalBatches → get total batches count per domain
router.get("/totalBatches", async (req, res) => {
  try {
    console.log("Fetching total batches...");
    
    const [rows] = await pool.query(`
      SELECT domain, COUNT(*) as count
      FROM batches
      GROUP BY domain
    `);

    console.log("Raw database results:", rows);

    // If no batches found
    if (rows.length === 0) {
      console.log("No batches found in database");
      return res.json({ 
        totalBatchesPerDomain: {
          fullstack: 0,
          data: 0,
          marketing: 0,
          sap: 0,
          banking: 0,
          devops: 0
        } 
      });
    }

    const mapDomainToKey = (domain) => {
      const map = {
        "Full Stack": "fullstack",
        "Full Stack Development": "fullstack",
        "Data Analytics": "data",
        "Data Analytics & Science": "data",
        "Digital Marketing": "marketing",
        "Marketing": "marketing",
        "SAP": "sap",
        "Banking": "banking",
        "Banking & Financial Services": "banking",
        "DevOps": "devops",
      };
      const mapped = map[domain] || domain.toLowerCase().replace(/\s+/g, "");
      console.log(`Mapping: "${domain}" -> "${mapped}"`);
      return mapped;
    };

    const totalBatchesPerDomain = rows.reduce((acc, row) => {
      const key = mapDomainToKey(row.domain);
      acc[key] = row.count;
      return acc;
    }, {});

    console.log("Final mapped result:", totalBatchesPerDomain);

    // Ensure all domains are present (even if 0)
    const finalResult = {
      fullstack: totalBatchesPerDomain.fullstack || 0,
      data: totalBatchesPerDomain.data || 0,
      marketing: totalBatchesPerDomain.marketing || 0,
      sap: totalBatchesPerDomain.sap || 0,
      banking: totalBatchesPerDomain.banking || 0,
      devops: totalBatchesPerDomain.devops || 0,
    };

    res.json({ totalBatchesPerDomain: finalResult });

  } catch (err) {
    console.error("Total Batches Error:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Failed to fetch total batches" });
  }
});


// Add this to your batches.js route file
router.get("/test", (req, res) => {
  res.json({ message: "Batches API is working!", timestamp: new Date().toISOString() });
});


//get batch by batch_no
router.get("/batchNo/:batchName",async(req,res)=>{
    try{
        const { batchName } = req.params;
        const [rows] = await pool.query("SELECT * FROM batches WHERE batchName = ?", [batchName]);
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

//get batch by batchName or start_date or end_date or mode
// router.get("/search",async(req,res)=>{
//     try{
//         const { batchName, start_date, end_date, mode } = req.query;
//         let query = "SELECT * FROM batches WHERE 1=1";
//         let params = [];
//         if(batchName){
//             query += " AND batchName LIKE ?";
//             params.push(`%${batchName}%`);
//         }
//         if(start_date){
//             query += " AND start_date = ?";
//             params.push(start_date);
//         }
//         if(end_date){
//             query += " AND end_date = ?";
//             params.push(end_date);
//         } 
//         if(mode){
//             query += " AND mode = ?";
//             params.push(mode);
//         }
//         const [rows] = await pool.query(query, params);
//         res.json(rows);
//     }
//     catch(err){
//         console.error(err);
//         res.status(500).json({error:"Internal Server Error"});
//     }
// });

router.get("/search",async(req,res)=>{
    try{
        const { batchName, start_date, end_date, mode } = req.query;
        let query = "SELECT * FROM batches WHERE 1=1";
        let params = [];
        if(batchName){
            query += " AND batchName LIKE ?";
            params.push(`%${batchName}%`);
        }
        if(start_date){
            query += " AND start_date = ?";
            params.push(start_date);
        }
        if(end_date){
            query += " AND end_date = ?";
            params.push(end_date);
        } 
        if(mode){
            query += " AND mode = ?";
            params.push(mode);
        }
        console.log("Query:", query, params); // <-- Add this line
        const [rows] = await pool.query(query, params);
        res.json(rows);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:"Internal Server Error"});
    }
});

module.exports = router;