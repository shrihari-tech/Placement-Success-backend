// routes/Sme.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

//batchListTab routes

// ----------------------
// STATIC ROUTES (MUST COME FIRST)
// ----------------------

// GET all students
router.get("/students", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students");
    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// SEARCH students by batch_no (e.g., ?query=FS01)
router.get("/students/search", async (req, res) => {
  try {
    const { query } = req.query;
    let sql = "SELECT * FROM students";
    const params = [];

    if (query) {
      sql += " WHERE batch_no LIKE ?";
      params.push(`%${query}%`);
    }

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error("Error searching students by batch:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET EPIC stats per batch
router.get("/students/epic-stats", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        batch_no, 
        COALESCE(NULLIF(epic_status, ''), 'Capable') AS epic_status, 
        COUNT(*) AS count
      FROM students
      WHERE batch_no IS NOT NULL AND batch_no != ''
      GROUP BY batch_no, COALESCE(NULLIF(epic_status, ''), 'Capable')
    `);

    const EPIC_STATUSES = ["Excellent", "Proficient", "Ideal", "Capable"];
    const epicStats = {};

    // Initialize all batches with all statuses = 0
    rows.forEach((row) => {
      const batch = row.batch_no;
      const status = row.epic_status;

      if (!epicStats[batch]) {
        epicStats[batch] = {};
        EPIC_STATUSES.forEach((s) => {
          epicStats[batch][s] = 0;
        });
      }

      if (EPIC_STATUSES.includes(status)) {
        epicStats[batch][status] = row.count;
      }
    });

    res.json({ success: true, data: epicStats });
  } catch (error) {
    console.error("Error fetching EPIC stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET students by exact batch_no
router.get("/students/batch/:batch_no", async (req, res) => {
  try {
    const { batch_no } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM students WHERE batch_no = ?",
      [batch_no]
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error("Error fetching students by batch:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==============================
// TRAINER ASSIGNMENT ROUTES
// ==============================

// 1. GET /sme/trainers
// Returns list of active trainers (for dropdown)
router.get("/trainers", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM trainers WHERE is_active = TRUE ORDER BY name"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 2. GET /sme/batches/:batch_no/trainer-assignments
// Returns current trainer + timing arrays for a batch
router.get("/batches/:batch_no/trainer-assignments", async (req, res) => {
  try {
    const { batch_no } = req.params;

    // Validate batch_no
    if (!batch_no || typeof batch_no !== "string") {
      return res.status(400).json({ success: false, message: "Valid batch_no is required" });
    }

    const [rows] = await pool.query(
      `SELECT 
        t.name AS trainer_name,
        bt.start_time,
        bt.end_time
       FROM batch_trainers bt
       JOIN trainers t ON bt.trainer_id = t.id
       WHERE bt.batch_no = ?
       ORDER BY bt.assigned_at ASC`,
      [batch_no]
    );

    // Format time to "9:00 AM" style
    const formatTime = (timeStr) => {
      if (!timeStr) return "";
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const trainer = rows.map(r => r.trainer_name);
    const sTiming = rows.map(r => formatTime(r.start_time));
    const eTiming = rows.map(r => formatTime(r.end_time));

    res.json({
      success: true,
      data: { trainer, sTiming, eTiming }
    });
  } catch (error) {
    console.error("Error fetching trainer assignments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 3. POST /sme/batches/:batch_no/trainer-assignments
// Adds a new trainer + timing assignment for a batch
router.post("/batches/:batch_no/trainer-assignments", async (req, res) => {
  try {
    const { batch_no } = req.params;
    const { trainer_name, sTiming, eTiming } = req.body;

    // Validation
    if (!batch_no || typeof batch_no !== "string") {
      return res.status(400).json({ success: false, message: "Valid batch_no is required" });
    }
    if (!trainer_name || !sTiming || !eTiming) {
      return res.status(400).json({ success: false, message: "trainer_name, sTiming, and eTiming are required" });
    }

    // Validate time format (e.g., "9:00 AM")
    const timeRegex = /^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
    if (!timeRegex.test(sTiming) || !timeRegex.test(eTiming)) {
      return res.status(400).json({ success: false, message: "Time must be in format '9:00 AM'" });
    }

    if (sTiming === eTiming) {
      return res.status(400).json({ success: false, message: "Start and end time cannot be the same" });
    }

    // Convert "9:00 AM" → "09:00:00"
    const parseTimeTo24 = (timeStr) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    const start_time = parseTimeTo24(sTiming);
    const end_time = parseTimeTo24(eTiming);

    // Get trainer ID
    const [trainerRows] = await pool.query(
      "SELECT id FROM trainers WHERE name = ? AND is_active = TRUE",
      [trainer_name]
    );
    if (trainerRows.length === 0) {
      return res.status(404).json({ success: false, message: "Trainer not found or inactive" });
    }
    const trainer_id = trainerRows[0].id;

    // Insert into batch_trainers
    await pool.query(
      `INSERT INTO batch_trainers (batch_no, trainer_id, start_time, end_time, assigned_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [batch_no, trainer_id, start_time, end_time]
    );

    res.status(201).json({
      success: true,
      message: "Trainer assignment added successfully"
    });
  } catch (error) {
    console.error("Error assigning trainer:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ----------------------
// DYNAMIC ROUTES (MUST COME LAST)
// ----------------------

// GET student by booking_id
router.get("/students/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM students WHERE booking_id = ?",
      [booking_id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// CREATE new student
router.post("/students", async (req, res) => {
  try {
    const {
      booking_id,
      name,
      email,
      phone,
      batch_no,
      mode,
      epic_status,
      placement,
      company,
      designation,
      salary,
      placed_month,
      domain_score,
      aptitude_score,
      communication_score,
      address,
      ug,
      pg,
      experience,
      attendance,
      mile1,
      mile2,
      mile3,
      irc,
      status,
      trainer_name,
      domain,
    } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: "booking_id is required" });
    }

    const [result] = await pool.query(
      `INSERT INTO students 
       (booking_id, name, email, phone, batch_no, mode, epic_status, placement, company, designation, salary, placed_month, domain_score, aptitude_score, communication_score, address, ug, pg, experience, attendance, mile1, mile2, mile3, irc, status, trainer_name, domain, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        booking_id,
        name,
        email,
        phone,
        batch_no,
        mode,
        epic_status,
        placement,
        company || null,
        designation || null,
        salary || null,
        placed_month || null,
        domain_score || 0,
        aptitude_score || 0,
        communication_score || 0,
        address || null,
        ug || null,
        pg || null,
        experience || null,
        attendance || null,
        mile1 || null,
        mile2 || null,
        mile3 || null,
        irc || null,
        status || null,
        trainer_name || null,
        domain || null,
      ]
    );

    res.status(201).json({
      success: true,
      studentId: result.insertId,
      message: "Student created successfully",
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// UPDATE student by booking_id
router.put("/students/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      name,
      email,
      phone,
      batch_no,
      mode,
      epic_status,
      placement,
      company,
      designation,
      salary,
      placed_month,
      domain_score,
      aptitude_score,
      communication_score,
      address,
      ug,
      pg,
      experience,
      attendance,
      mile1,
      mile2,
      mile3,
      irc,
      status,
      trainer_name,
      domain,
    } = req.body;

    const fields = [];
    const values = [];

    // Only update fields that are provided
    if (name !== undefined) fields.push("name = ?"), values.push(name);
    if (email !== undefined) fields.push("email = ?"), values.push(email);
    if (phone !== undefined) fields.push("phone = ?"), values.push(phone);
    if (batch_no !== undefined) fields.push("batch_no = ?"), values.push(batch_no);
    if (mode !== undefined) fields.push("mode = ?"), values.push(mode);
    if (epic_status !== undefined) fields.push("epic_status = ?"), values.push(epic_status);
    if (placement !== undefined) fields.push("placement = ?"), values.push(placement);
    if (company !== undefined) fields.push("company = ?"), values.push(company || null);
    if (designation !== undefined) fields.push("designation = ?"), values.push(designation || null);
    if (salary !== undefined) fields.push("salary = ?"), values.push(salary || null);
    if (placed_month !== undefined) fields.push("placed_month = ?"), values.push(placed_month || null);
    if (domain_score !== undefined) fields.push("domain_score = ?"), values.push(domain_score);
    if (aptitude_score !== undefined) fields.push("aptitude_score = ?"), values.push(aptitude_score);
    if (communication_score !== undefined) fields.push("communication_score = ?"), values.push(communication_score);
    if (address !== undefined) fields.push("address = ?"), values.push(address || null);
    if (ug !== undefined) fields.push("ug = ?"), values.push(ug || null);
    if (pg !== undefined) fields.push("pg = ?"), values.push(pg || null);
    if (experience !== undefined) fields.push("experience = ?"), values.push(experience || null);
    if (attendance !== undefined) fields.push("attendance = ?"), values.push(attendance || null);
    if (mile1 !== undefined) fields.push("mile1 = ?"), values.push(mile1 || null);
    if (mile2 !== undefined) fields.push("mile2 = ?"), values.push(mile2 || null);
    if (mile3 !== undefined) fields.push("mile3 = ?"), values.push(mile3 || null);
    if (irc !== undefined) fields.push("irc = ?"), values.push(irc || null);
    if (status !== undefined) fields.push("status = ?"), values.push(status || null);
    if (trainer_name !== undefined) fields.push("trainer_name = ?"), values.push(trainer_name || null);
    if (domain !== undefined) fields.push("domain = ?"), values.push(domain || null);

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const sql = `UPDATE students SET ${fields.join(", ")} WHERE booking_id = ?`;
    const finalValues = [...values, bookingId];

    const [result] = await pool.query(sql, finalValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Student updated successfully" });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// DELETE student by booking_id
router.delete("/students/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const [result] = await pool.query(
      "DELETE FROM students WHERE booking_id = ?",
      [bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


//dashboard routes

// ----------------------
// DASHBOARD ROUTES
// ----------------------

// GET dashboard overview data for a specific domain
// Example: GET /sme/dashboard?domain=fullstack
router.get("/dashboard", async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ success: false, message: "Domain query parameter is required" });
    }

    // Validate domain
    const validDomains = ["fullstack", "dataanalytics", "marketing", "devops", "sap", "banking"];
    if (!validDomains.includes(domain)) {
      return res.status(400).json({ success: false, message: "Invalid domain" });
    }


    // Add this mapping in your dashboard route
const domainNameMap = {
  fullstack: "Full Stack",
  dataanalytics: "Data Analytics",
  marketing: "Digital Marketing",
  devops: "DevOps",
  banking: "Banking",
  sap: "SAP"
};

const dbDomainName = domainNameMap[domain];
if (!dbDomainName) {
  return res.status(400).json({ success: false, message: "Invalid domain" });
}

    // Fetch all students for the domain
   
const [students] = await pool.query(
  `SELECT batch_no, status, placement, epic_status 
   FROM students 
   WHERE LOWER(domain) = ?`,
  [domain.toLowerCase()]
);

const [batches] = await pool.query(
  `SELECT DISTINCT batch_no 
   FROM students 
   WHERE LOWER(domain) = ? 
     AND batch_no IS NOT NULL 
     AND batch_no != ''`,
  [domain.toLowerCase()]
);

    const totalBatches = batches.length;
    const totalStudents = students.length;

    const ongoingCount = students.filter(s => s.status?.toLowerCase() === "ongoing").length;
    const completedCount = students.filter(s => s.status?.toLowerCase() === "completed").length;

    const placed = students.filter(s => s.placement === "Placed").length;
    const yetToPlace = students.filter(s => s.placement === "Yet to Place").length;
    const notPlaced = students.filter(s => s.placement === "Not Placed").length;

    // EPIC status aggregation
    const epicCountMap = {};
    students.forEach(s => {
      let status = s.epic_status;
      if (!status || status.trim() === "") {
        status = "Capable"; // Default as per your frontend logic
      }
      epicCountMap[status] = (epicCountMap[status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalBatches,
        totalStudents,
        ongoingCount,
        completedCount,
        placed,
        yetToPlace,
        notPlaced,
        epicCountMap,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Optional: GET list of all domains with batch counts (for navigation or multi-domain SMEs)
router.get("/domains", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        domain,
        COUNT(DISTINCT batch_no) AS batchCount,
        COUNT(*) AS studentCount
      FROM students 
      WHERE domain IS NOT NULL AND domain != ''
      GROUP BY domain
    `);

    const domainMap = {};
    rows.forEach(row => {
      domainMap[row.domain] = {
        batchCount: row.batchCount,
        studentCount: row.studentCount,
      };
    });

    res.json({ success: true, data: domainMap });
  } catch (error) {
    console.error("Error fetching domain stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


//trainer update routes



module.exports = router;