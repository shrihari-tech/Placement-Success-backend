const router = require("express").Router();
const pool = require("../db");

// get all students
router.get("/allStudents", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// post a student - bulk add
router.post("/bulkAdd/:batchName", async (req, res) => {
  const { batchName } = req.params;
  const { students } = req.body; // expects an array of students

  if (!batchName) {
    return res.status(400).json({ error: "Batch name is required in params" });
  }

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: "No student data provided" });
  }

  const values = students.map((s) => [
    s.batchId || null,
    s.batchName || batchName,
    s.name || "",
    s.email || "",
    s.bookingId || "",
    s.phone || "",
    s.alternatePhone || null,
    s.mode || "",
    s.gender || null,
    s.dob || null,
    s.address || null,
    s.pincode || null,
    s.city || null,
    s.state || null,
    s.photoUrl || null,
    s.cvUrl || null,
    s.tenthPercentage || null,
    s.tenthYear || null,
    s.twelfthPercentage || null,
    s.twelfthYear || null,
    s.ugPercentage || null,
    s.ugMode || null,
    s.ugSpecialization || null,
    s.ugYear || null,
    s.ugCertificateAvailable || false,
    s.ugArrearsPending || null,
    s.pgPercentage || null,
    s.pgSpecialization || null,
    s.pgYear || null,
    s.pgCertificateAvailable || false,
    s.pgArrearsPending || null,
    s.gapInEducation || null,
    s.gapReason || null,
    s.workExperienceYears || null,
    s.workExperienceMonths || null,
    s.previousOrganisation || null,
    s.willingToRelocate || false,
    s.languagesWrite || null,
    s.languagesRead || null,
    s.languagesSpeak || null,
    s.certificateReceived || "N",
    s.epicStatus || "",
    s.placement || "",
  ]);

  const sql = `
    INSERT INTO students (
      batchId, batchName, name, email, bookingId, phone, alternatePhone,
      mode, gender, dob, address, pincode, city, state, photoUrl, cvUrl,
      tenthPercentage, tenthYear, twelfthPercentage, twelfthYear,
      ugPercentage, ugMode, ugSpecialization, ugYear, ugCertificateAvailable, ugArrearsPending,
      pgPercentage, pgSpecialization, pgYear, pgCertificateAvailable, pgArrearsPending,
      gapInEducation, gapReason, workExperienceYears, workExperienceMonths,
      previousOrganisation, willingToRelocate,
      languagesWrite, languagesRead, languagesSpeak,
      certificateReceived, epicStatus, placement
    ) VALUES ?
  `;

  try {
    const [result] = await pool.query(sql, [values]);
    res.json({
      message: "Students inserted successfully",
      insertedCount: result.affectedRows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get all students by batch id
// router.get("/batch/:batchId", async (req, res) => {

//   const { batchId } = req.params;
//     try {
//         const [rows] = await pool.query("SELECT * FROM students WHERE batchId = ?", [batchId]);
//         res.json(rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

router.get("/students", async (req, res) => {
  const { batchId, placement } = req.query; // ✅ use query params instead of params

  try {
    let query = "SELECT * FROM students WHERE 1=1";
    const values = [];

    if (batchId) {
      query += " AND batchId = ?";
      values.push(batchId);
    }

    if (placement) {
      query += " AND placement = ?";
      values.push(placement);
    }

    if (!batchId && !placement) {
      return res
        .status(400)
        .json({ error: "Please provide either batchId or placement" });
    }

    const [rows] = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get student by booking id
router.get("/student/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM students WHERE bookingId = ?",
      [bookingId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get student by batchno
router.get("/:batchName", async (req, res) => {
  try {
    const { batchName } = req.params; // Correctly match the param
    const [rows] = await pool.query(
      "SELECT * FROM students WHERE batchName = ?",
      [batchName]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No students found for this batch" });
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get students by batchname & epic
router.get("/:batchName/:epicStatus", async (req, res) => {
  try {
    const { batchName, epicStatus } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM students WHERE batchName = ? AND epicStatus = ?",
      [batchName, epicStatus]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No students found for this batch and epic status" });
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get all placed students
router.get("/placed", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM students WHERE placement = 'Placed'"
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No placed students found" });
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// mark student as ineligible and not required for placement
// Mark student as Not Required or Ineligible
router.put("/placement/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body; // expects "Not Required" or "Ineligible"

    if (!status || !["Not Required", "Ineligible"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Use 'Not Required' or 'Ineligible'",
      });
    }

    const [result] = await pool.query(
      "UPDATE students SET placement = ? WHERE bookingId = ?",
      [status, bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: `Student marked as ${status} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ DASHBOARD STATS & GRAPHS (Placement Ops Head) ============
// GET /students/stats
router.get("/stats", async (req, res) => {
  try {
    // 1. Total Batches per Domain
    const [totalBatches] = await pool.query(`
      SELECT domain, COUNT(*) as count
      FROM batches
      GROUP BY domain
    `);

    // 2. Upcoming Batches per Domain (startDate > today)
    const [upcomingBatches] = await pool.query(`
      SELECT domain, COUNT(*) as count
      FROM batches
      WHERE startDate > CURDATE()
      GROUP BY domain
    `);

    // 3. Placed Students per Domain
    const [placedStudents] = await pool.query(`
      SELECT b.domain, COUNT(*) as count
      FROM students s
      JOIN batches b ON s.batchId = b.id
      WHERE s.placement = 'Placed'
      GROUP BY b.domain
    `);

    // 4. Yet-to-be-Placed Students per Domain
    const [yetToPlaceStudents] = await pool.query(`
      SELECT b.domain, COUNT(*) as count
      FROM students s
      JOIN batches b ON s.batchId = b.id
      WHERE s.placement IN ('Yet to Place', 'Not Placed')
      GROUP BY b.domain
    `);

    // Map domains to consistent keys
    const mapDomainToKey = (domain) => {
      const map = {
        "Full Stack": "fullstack",
        "Data Analytics": "data",
        "Data Analytics & Science": "data",
        "Digital Marketing": "marketing",
        "Marketing": "marketing",
        SAP: "sap",
        Banking: "banking",
        "Banking & Financial Services": "banking",
        DevOps: "devops",
      };
      return map[domain] || domain.toLowerCase().replace(/\s+/g, "");
    };

    const formatData = (rows) =>
      rows.reduce((acc, row) => {
        acc[mapDomainToKey(row.domain)] = row.count;
        return acc;
      }, {});

    res.json({
      totalBatchesPerDomain: formatData(totalBatches),
      upcomingBatchesPerDomain: formatData(upcomingBatches),
      placedStudentsPerDomain: formatData(placedStudents),
      yetToPlaceStudentsPerDomain: formatData(yetToPlaceStudents),
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err.message, err.sql);
    res.status(500).json({ error: err.message });
  }
});

// GET /students/graphs
router.get("/graphs", async (req, res) => {
  try {
    // Placements grouped by month
    const [currentYearData] = await pool.query(`
      SELECT 
        MONTH(placedMonth) as month,
        COUNT(*) as studentCount,
        AVG(salary) as avgPackage
      FROM students
      WHERE placement = 'Placed'
        AND placedMonth IS NOT NULL
        AND YEAR(placedMonth) = YEAR(CURDATE())
      GROUP BY MONTH(placedMonth)
      ORDER BY MONTH(placedMonth)
    `);

    const [previousYearData] = await pool.query(`
      SELECT 
        MONTH(placedMonth) as month,
        COUNT(*) as studentCount,
        AVG(salary) as avgPackage
      FROM students
      WHERE placement = 'Placed'
        AND placedMonth IS NOT NULL
        AND YEAR(placedMonth) = YEAR(CURDATE()) - 1
      GROUP BY MONTH(placedMonth)
      ORDER BY MONTH(placedMonth)
    `);

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const formatGraphData = (rows) =>
      rows.map(row => ({
        name: monthNames[row.month - 1],
        value: Math.round(row.studentCount)
      }));

    const fillMissingMonths = (data) => {
      const filled = [];
      for (let i = 1; i <= 12; i++) {
        const monthName = monthNames[i - 1];
        const found = data.find(d => d.name === monthName);
        filled.push(found || { name: monthName, value: 0 });
      }
      return filled;
    };

    res.json({
      previousData: fillMissingMonths(formatGraphData(previousYearData)),
      currentData: fillMissingMonths(formatGraphData(currentYearData)),
    });
  } catch (err) {
    console.error("Dashboard Graphs Error:", err.message, err.sql);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
