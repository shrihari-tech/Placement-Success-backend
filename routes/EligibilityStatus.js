const router = require("express").Router();
const pool = require("../db");

// ✅ Get all eligibility statuses
router.get("/all", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM eligibility_status ORDER BY id ASC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching statuses", error });
  }
});

// ✅ Get one eligibility status by id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM eligibility_status WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error fetching status", error });
  }
});

// ✅ Create eligibility status
router.post("/create", async (req, res) => {
  const { label } = req.body;
  if (!label) return res.status(400).json({ message: "Label is required" });

  try {
    const [result] = await pool.query("INSERT INTO eligibility_status (label) VALUES (?)", [label]);
    res.json({ id: result.insertId, label });
  } catch (error) {
    res.status(500).json({ message: "Error creating status", error });
  }
});

// ✅ Update eligibility status
router.put("/:id", async (req, res) => {
  const { label } = req.body;
  if (!label) return res.status(400).json({ message: "Label is required" });

  try {
    await pool.query("UPDATE eligibility_status SET label = ? WHERE id = ?", [label, req.params.id]);
    res.json({ id: req.params.id, label });
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error });
  }
});

// ✅ Delete eligibility status
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM eligibility_status WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting status", error });
  }
});

module.exports = router;
