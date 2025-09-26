const router = require("express").Router();
const pool = require("../db");


//create a domain
router.post("/createDomain", async (req, res) => {
  try {
    const { key, label } = req.body;
    if (!key || !label) {
      return res.status(400).json({ error: "Both key and label are required" });
    }
    const [result] = await pool.query("INSERT INTO domains (`key`, label) VALUES (?, ?)",[key, label]);
    res.status(201).json({ message: "Domain created successfully", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// get all domains
router.get("/allDomains", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM domains");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get domain by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM domains WHERE id = ?", [id]);
        if (rows.length === 0) {
          return res.status(404).json({ error: "Domain not found" });
        }
        res.json(rows[0]);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        }
});
// update domain by id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
    const { key, label } = req.body;
    try {
        const [result] = await pool.query("UPDATE domains SET `key` = ?, label = ? WHERE id = ?",[key, label, id]
        );
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Domain not found" });
        }
        res.json({ message: "Domain updated successfully" });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        }
});

module.exports = router;
