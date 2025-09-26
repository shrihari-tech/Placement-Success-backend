// routes/Placement.js
import express from "express";
import pool from "../config/db.js"; // adjust your db connection path

const router = express.Router();

// ✅ Create placement
router.post("/create", async (req, res) => {
  try {
    const { label } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: "Label is required" });
    }

    const [result] = await pool.query(
      "INSERT INTO placements (label) VALUES (?)",
      [label.trim()]
    );

    res.status(201).json({
      message: "Placement created successfully",
      placementId: result.insertId,
    });
  } catch (err) {
    console.error("Error creating placement:", err);
    res.status(500).json({ error: "Failed to create placement" });
  }
});

// ✅ Get all placements
router.get("/placements", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM placements ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching placements:", err);
    res.status(500).json({ error: "Failed to fetch placements" });
  }
});

// ✅ Get single placement by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM placements WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Placement not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching placement:", err);
    res.status(500).json({ error: "Failed to fetch placement" });
  }
});

// ✅ Update placement
router.put("/:id", async (req, res) => {
  try {
    const { label } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: "Label is required" });
    }

    const [result] = await pool.query(
      "UPDATE placements SET label = ? WHERE id = ?",
      [label.trim(), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Placement not found" });
    }

    res.json({ message: "Placement updated successfully" });
  } catch (err) {
    console.error("Error updating placement:", err);
    res.status(500).json({ error: "Failed to update placement" });
  }
});

// ✅ Delete placement
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM placements WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Placement not found" });
    }

    res.json({ message: "Placement deleted successfully" });
  } catch (err) {
    console.error("Error deleting placement:", err);
    res.status(500).json({ error: "Failed to delete placement" });
  }
});

export default router;
