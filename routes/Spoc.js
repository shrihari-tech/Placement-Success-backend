const router = require('express').Router();
const pool = require('../db');

//create a spoc
router.post("/createSPOC", async (req, res) => {
  try {
    const { name, company, address, email, phone } = req.body;

    if (!name || !company || !address || !email || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const sql = `INSERT INTO spocs (name, company, address, email, phone) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [name, company, address, email, phone]);

    res.status(201).json({ message: "SPOC created successfully", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// get all spocs
router.get("/allSPCOS", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM spocs");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get spoc by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM spocs WHERE id = ?", [id]);
        if (rows.length === 0) {
          return res.status(404).json({ error: "SPOC not found" });
        }
        res.json(rows[0]);
        } 
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        }
});

// update spoc by id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, company, address, email, phone } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE spocs SET name = ?, company = ?, address = ?, email = ?, phone = ? WHERE id = ?",
            [name, company, address, email, phone, id]
        );
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "SPOC not found" });
        }
        res.json({ message: "SPOC updated successfully" });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        }
});

// delete spoc by id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM spocs WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "SPOC not found" });
        }
        res.json({ message: "SPOC deleted successfully" });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        }
});


module.exports = router;

