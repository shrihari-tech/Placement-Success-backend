// routes/owner.js
const router = require("express").Router();
const pool = require("../db");

// ➤ GET /owner/dashboard/counts — Get Dashboard Counts for Placement Ops Head
router.get("/dashboard/counts", async (req, res) => {
  try {
    // 1. Ongoing Batches per Domain
    const [ongoingBatches] = await pool.query(`
      SELECT domain, COUNT(*) as count
      FROM batches
      WHERE status = 'Ongoing'
      GROUP BY domain
    `);

    // 2. Live Students per Domain (status = 'Ongoing')
    const [liveStudents] = await pool.query(`
      SELECT 
        CASE 
          WHEN batch_no LIKE 'FS%' THEN 'fullstack'
          WHEN batch_no LIKE 'DA%' THEN 'data'
          WHEN batch_no LIKE 'MK%' THEN 'marketing'
          WHEN batch_no LIKE 'SA%' THEN 'sap'
          WHEN batch_no LIKE 'BK%' THEN 'banking'
          WHEN batch_no LIKE 'DV%' THEN 'devops'
        END as domain,
        COUNT(*) as count
      FROM students
      WHERE status = 'Ongoing'
      GROUP BY 
        CASE 
          WHEN batch_no LIKE 'FS%' THEN 'fullstack'
          WHEN batch_no LIKE 'DA%' THEN 'data'
          WHEN batch_no LIKE 'MK%' THEN 'marketing'
          WHEN batch_no LIKE 'SA%' THEN 'sap'
          WHEN batch_no LIKE 'BK%' THEN 'banking'
          WHEN batch_no LIKE 'DV%' THEN 'devops'
        END
    `);

    // 3. Unique Trainers per Domain
    const [trainers] = await pool.query(`
      SELECT domain, COUNT(DISTINCT trainer_name) as count
      FROM batches
      GROUP BY domain
    `);

    // Helper to format response
    const formatData = (rows) =>
      rows.reduce(
        (acc, row) => {
          acc[row.domain] = row.count || 0;
          return acc;
        },
        {
          fullstack: 0,
          data: 0,
          marketing: 0,
          sap: 0,
          banking: 0,
          devops: 0,
        }
      );

    res.json({
      ongoingBatchesPerDomain: formatData(ongoingBatches),
      liveStudentsPerDomain: formatData(liveStudents),
      trainerCountPerDomain: formatData(trainers),
    });
  } catch (err) {
    console.error("Owner Dashboard Counts Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➤ GET /owner/dashboard/graphs — Get Placed vs Yet-to-Place Graph Data
router.get("/dashboard/graphs", async (req, res) => {
  try {
    // Placed Students per Domain
    const [placedStudents] = await pool.query(`
      SELECT 
        CASE 
          WHEN batch_no LIKE 'FS%' THEN 'fullstack'
          WHEN batch_no LIKE 'DA%' THEN 'data'
          WHEN batch_no LIKE 'MK%' THEN 'marketing'
          WHEN batch_no LIKE 'SA%' THEN 'sap'
          WHEN batch_no LIKE 'BK%' THEN 'banking'
          WHEN batch_no LIKE 'DV%' THEN 'devops'
        END as domain,
        COUNT(*) as count
      FROM students
      WHERE placement = 'Placed'
      GROUP BY 
        CASE 
          WHEN batch_no LIKE 'FS%' THEN 'fullstack'
          WHEN batch_no LIKE 'DA%' THEN 'data'
          WHEN batch_no LIKE 'MK%' THEN 'marketing'
          WHEN batch_no LIKE 'SA%' THEN 'sap'
          WHEN batch_no LIKE 'BK%' THEN 'banking'
          WHEN batch_no LIKE 'DV%' THEN 'devops'
        END
    `);

    // Yet-to-be-Placed Students per Domain
    const [yetToPlaceStudents] = await pool.query(`
      SELECT 
        CASE 
          WHEN batch_no LIKE 'FS%' THEN 'fullstack'
          WHEN batch_no LIKE 'DA%' THEN 'data'
          WHEN batch_no LIKE 'MK%' THEN 'marketing'
          WHEN batch_no LIKE 'SA%' THEN 'sap'
          WHEN batch_no LIKE 'BK%' THEN 'banking'
          WHEN batch_no LIKE 'DV%' THEN 'devops'
        END as domain,
        COUNT(*) as count
      FROM students
      WHERE placement IN ('Yet to Place', 'Not Placed')
      GROUP BY 
        CASE 
          WHEN batch_no LIKE 'FS%' THEN 'fullstack'
          WHEN batch_no LIKE 'DA%' THEN 'data'
          WHEN batch_no LIKE 'MK%' THEN 'marketing'
          WHEN batch_no LIKE 'SA%' THEN 'sap'
          WHEN batch_no LIKE 'BK%' THEN 'banking'
          WHEN batch_no LIKE 'DV%' THEN 'devops'
        END
    `);

    // Format for frontend graphs
    const formatGraphData = (rows) =>
      rows.map((row) => ({
        name:
          row.domain === "fullstack"
            ? "FSD"
            : row.domain === "data"
            ? "DADS"
            : row.domain === "marketing"
            ? "MK"
            : row.domain === "sap"
            ? "SAP"
            : row.domain === "banking"
            ? "BFS"
            : row.domain === "devops"
            ? "DV"
            : row.domain,
        students: row.count || 0,
      }));

    // Ensure all 6 domains are present (even if 0)
    const domains = [
      { key: "fullstack", label: "FSD" },
      { key: "data", label: "DADS" },
      { key: "marketing", label: "MK" },
      { key: "sap", label: "SAP" },
      { key: "banking", label: "BFS" },
      { key: "devops", label: "DV" },
    ];

    const fillMissing = (data) => {
      return domains.map((d) => {
        const found = data.find((item) => item.name === d.label);
        return found || { name: d.label, students: 0 };
      });
    };

    const placedData = fillMissing(formatGraphData(placedStudents));
    const yetToPlaceData = fillMissing(formatGraphData(yetToPlaceStudents));

    res.json({
      placedData,
      yetToPlaceData,
    });
  } catch (err) {
    console.error("Owner Dashboard Graphs Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➤ GET /owner/reports/batches — Search Students by Domain/Batch
router.get("/reports/batches", async (req, res) => {
  try {
    const { domain, batch } = req.query;

    let query = `
      SELECT 
        s.name,
        s.email,
        s.phone,
        s.batch_no as batch,
        s.placement,
        s.booking_id
      FROM students s
      WHERE 1=1
    `;
    const values = [];

    if (domain) {
      const prefix = getBatchPrefix(domain);
      if (!prefix) {
        return res.status(400).json({ error: "Invalid domain" });
      }
      query += ` AND s.batch_no LIKE ?`;
      values.push(`${prefix}%`);
    }

    if (batch) {
      query += ` AND s.batch_no = ?`;
      values.push(batch);
    }

    const [rows] = await pool.query(query, values);

    res.json(rows);
  } catch (err) {
    console.error("Owner Reports Batches Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➤ GET /owner/reports/placements — Search Placed Students by Domain/Batch
router.get("/reports/placements", async (req, res) => {
  try {
    const { domain, batch } = req.query;

    let query = `
      SELECT 
        s.name,
        s.company,
        s.designation,
        s.salary,
        s.batch_no as batch,
        s.booking_id
      FROM students s
      WHERE s.placement = 'Placed'
    `;
    const values = [];

    if (domain) {
      const prefix = getBatchPrefix(domain);
      if (!prefix) {
        return res.status(400).json({ error: "Invalid domain" });
      }
      query += ` AND s.batch_no LIKE ?`;
      values.push(`${prefix}%`);
    }

    if (batch) {
      query += ` AND s.batch_no = ?`;
      values.push(batch);
    }

    const [rows] = await pool.query(query, values);

    res.json(rows);
  } catch (err) {
    console.error("Owner Reports Placements Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➤ GET /owner/reports/student/:bookingId — Get Student Details by Booking ID
router.get("/reports/student/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        s.name,
        s.email,
        s.phone,
        s.batch_no as batch,
        s.placement,
        s.epic_status as epicStatus,
        s.attendance,
        s.company,
        s.designation,
        s.salary,
        s.mode,
        s.trainer_name as trainerName,
        s.domain_score as domainScore,
        s.aptitude_score as aptitudeScore,
        s.communication_score as communicationScore
      FROM students s
      WHERE s.booking_id = ?
    `,
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Owner Reports Student Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➤ GET /owner/reports/domains — Get All Domains (for dropdown)
router.get("/reports/domains", async (req, res) => {
  try {
    const domains = [
      { key: "fullstack", label: "Full Stack Development" },
      { key: "dataanalytics", label: "Data Analytics & Science" },
      { key: "marketing", label: "Digital Marketing" },
      { key: "sap", label: "SAP" },
      { key: "banking", label: "Banking & Financial Services" },
      { key: "devops", label: "DevOps" },
    ];
    res.json(domains);
  } catch (err) {
    console.error("Owner Reports Domains Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➤ GET /owner/reports/batches-by-domain — Get Batches by Domain
router.get("/reports/batches-by-domain", async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const prefix = getBatchPrefix(domain);
    if (!prefix) {
      return res.status(400).json({ error: "Invalid domain" });
    }

    const [rows] = await pool.query(
      `
      SELECT batch_no as batchNo, trainer_name as trainerName, mode, status
      FROM batches
      WHERE batch_no LIKE ?
      ORDER BY batch_no
    `,
      [`${prefix}%`]
    );

    res.json(rows);
  } catch (err) {
    console.error("Owner Reports Batches by Domain Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➤ GET /owner/epic/search — Search Students by Domain/Batch for EPIC Report
router.get("/epic/search", async (req, res) => {
  try {
    const { domain, batch } = req.query;

    let query = `
      SELECT 
        s.name,
        s.email,
        s.phone,
        s.batch_no as batch,
        s.attendance,
        s.epic_status as epicStatus,
        s.booking_id
      FROM students s
      WHERE 1=1
    `;
    const values = [];

    if (domain) {
      const prefix = getBatchPrefix(domain);
      if (!prefix) {
        return res.status(400).json({ error: "Invalid domain" });
      }
      query += ` AND s.batch_no LIKE ?`;
      values.push(`${prefix}%`);
    }

    if (batch) {
      query += ` AND s.batch_no = ?`;
      values.push(batch);
    }

    const [rows] = await pool.query(query, values);

    res.json(rows);
  } catch (err) {
    console.error("Owner EPIC Search Error:", err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper: Map domain to batch prefix
function getBatchPrefix(domain) {
  const map = {
    fullstack: "FS",
    data:"DA",
    dataanalytics: "DA",
    marketing: "MK",
    sap: "SA",
    banking: "BK",
    devops: "DV",
  };
  return map[domain];
}

module.exports = router;


// ➤ GET /owner/placement/yet-to-place
router.get("/placement/yet-to-place", async (req, res) => {
  try {
    const { domain, batch } = req.query;
    let query = `
      SELECT 
        s.name,
        s.email,
        s.phone,
        s.batch_no as batch,
        s.attendance,
        s.epic_status as epicStatus,
        s.booking_id
      FROM students s
      WHERE s.placement = 'Yet to Place'
    `;
    const values = [];

    if (domain) {
      const prefix = getBatchPrefix(domain);
      if (!prefix) return res.status(400).json({ error: "Invalid domain" });
      query += ` AND s.batch_no LIKE ?`;
      values.push(`${prefix}%`);
    }

    if (batch) {
      query += ` AND s.batch_no = ?`;
      values.push(batch);
    }

    const [rows] = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("Yet to Place Search Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});