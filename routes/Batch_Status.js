const router = require("express").Router();
const pool = require("../db");

router.get("/all", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM batch_status ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch batch statuses" });
  }
});

// Create new batch status
router.post("/create", async (req, res) => {
  const { label } = req.body;
  if (!label) return res.status(400).json({ error: "Label is required" });

  try {
    const [result] = await pool.query(
      "INSERT INTO batch_status (label) VALUES (?)",
      [label]
    );
    const [newRow] = await pool.query("SELECT * FROM batch_status WHERE id = ?", [
      result.insertId,
    ]);
    res.json(newRow[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create batch status" });
  }
});

// Update existing batch status
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { label } = req.body;
  if (!label) return res.status(400).json({ error: "Label is required" });

  try {
    await pool.query("UPDATE batch_status SET label = ? WHERE id = ?", [label, id]);
    const [updatedRow] = await pool.query("SELECT * FROM batch_status WHERE id = ?", [
      id,
    ]);
    res.json(updatedRow[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update batch status" });
  }
});

// Delete a batch status
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM batch_status WHERE id = ?", [id]);
    res.json({ message: "Batch status deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete batch status" });
  }
});

module.exports = router;