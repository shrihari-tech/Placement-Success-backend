const router = require('express').Router();
const pool = require('../db');

// get all scores
router.get('/allScores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM scores');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// add scores for a student
router.post("/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  const { mile1, mile2, mile3, irc, epicStatus, attendance } = req.body;

  const conn = await pool.getConnection();
  try {
    // Check if bookingId exists in students
    const [studentRows] = await conn.query(
      "SELECT bookingId FROM students WHERE bookingId = ?",
      [bookingId]
    );

    if (studentRows.length === 0) {
      return res.status(400).json({ error: `bookingId ${bookingId} not found in students table` });
    }

    // Insert or update score
    await conn.query(
      `INSERT INTO scores (bookingId, mile1, mile2, mile3, irc, epicStatus, attendance)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         mile1 = VALUES(mile1),
         mile2 = VALUES(mile2),
         mile3 = VALUES(mile3),
         irc = VALUES(irc),
         epicStatus = VALUES(epicStatus),
         attendance = VALUES(attendance)`,
      [bookingId, mile1, mile2, mile3, irc, epicStatus, attendance]
    );

    res.json({ message: `Score saved successfully for ${bookingId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } finally {
    conn.release();
  }
});


// Update scores for a student by bookingId
router.put("/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  const { mile1, mile2, mile3, irc, epicStatus, attendance } = req.body;

  const conn = await pool.getConnection();
  try {
    // Ensure student exists
    const [studentRows] = await conn.query(
      "SELECT bookingId FROM students WHERE bookingId = ?",
      [bookingId]
    );

    if (studentRows.length === 0) {
      return res.status(400).json({ error: `bookingId ${bookingId} not found in students table` });
    }

    // Ensure a score record exists first
    const [scoreRows] = await conn.query(
      "SELECT id FROM scores WHERE bookingId = ?",
      [bookingId]
    );

    if (scoreRows.length === 0) {
      return res.status(404).json({ error: `No score record found for bookingId: ${bookingId}` });
    }

    // Update the scores
    const [result] = await conn.query(
      `UPDATE scores 
       SET mile1 = ?, mile2 = ?, mile3 = ?, irc = ?, epicStatus = ?, attendance = ?, updatedAt = NOW()
       WHERE bookingId = ?`,
      [mile1, mile2, mile3, irc, epicStatus, attendance, bookingId]
    );

    res.json({
      message: `Scores updated successfully for ${bookingId}`,
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } finally {
    conn.release();
  }
});



module.exports = router;