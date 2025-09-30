// routes/placementOpportunities.js
const router = require("express").Router();
const pool = require("../db");

// POST /placementOpportunities/addOpportunity
router.post("/addOpportunity", async (req, res) => {
  const { companyName, driveDate, driveRole, package: salary, selectedBatch, domain, createdDomain } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO opportunities 
      (companyName, driveDate, driveRole, package, selectedBatch, domain, createdDomain) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [companyName, driveDate, driveRole, salary, selectedBatch, domain, createdDomain]
    );
    res.status(201).json({ message: "Opportunity created", id: result.insertId });
  } catch (err) {
    console.error("Error creating opportunity:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /placementOpportunities/allOpportunities
router.get("/allOpportunities", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM opportunities");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /placementOpportunities/opportunity/:id
router.get("/opportunity/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM opportunities WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ FIXED: GET /placementOpportunities/opportunity/:id/students
router.get("/opportunity/:id/students", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT s.* 
      FROM students s
      INNER JOIN opportunity_students os ON s.booking_id = os.studentBookingId
      WHERE os.opportunityId = ?
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching students for opportunity:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /placementOpportunities/assignStudents
router.post("/assignStudents", async (req, res) => {
  try {
    const { opportunityId, studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "Please provide an array of student bookingIds" });
    }
    const values = studentIds.map((bookingId) => [opportunityId, bookingId]);
    const [result] = await pool.query(
      `INSERT INTO opportunity_students (opportunityId, studentBookingId) VALUES ?`,
      [values]
    );
    res.json({
      message: "Students assigned to opportunity successfully",
      insertedRows: result.affectedRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /placementOpportunities/assignStudents (reassign)
router.put("/assignStudents", async (req, res) => {
  const { opportunityId, studentIds } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: "Please provide an array of student bookingIds" });
  }
  const values = studentIds.map((bookingId) => [opportunityId, bookingId]);
  try {
    await pool.query("DELETE FROM opportunity_students WHERE opportunityId = ?", [opportunityId]);
    const [result] = await pool.query(
      `INSERT INTO opportunity_students (opportunityId, studentBookingId) VALUES ?`,
      [values]
    );
    res.json({
      message: "Students reassigned to opportunity successfully",
      insertedRows: result.affectedRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /placementOpportunities/opportunity/:id
router.delete("/opportunity/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM opportunities WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    res.json({ message: "Opportunity deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /placementOpportunities/opportunity/:id
router.put("/opportunity/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, driveDate, driveRole, package: salary, selectedBatch, domain, createdDomain } = req.body;
    const [result] = await pool.query(
      `UPDATE opportunities SET companyName = ?, driveDate = ?, driveRole = ?, package = ?, selectedBatch = ?, domain = ?, createdDomain = ? WHERE id = ?`,
      [companyName, driveDate, driveRole, salary, selectedBatch, domain, createdDomain, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    res.json({ message: "Opportunity updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;