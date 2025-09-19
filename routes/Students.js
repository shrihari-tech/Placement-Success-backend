const router = require("express").Router();
const pool = require("../db");

// get all students
router.get("/allStudents",async(req,res)=>{
    try{
        const [rows] = await pool.query("SELECT * FROM students");
        res.json(rows);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:"Internal Server Error"});
    }
})

// post a student - bulk add
router.post("/bulkAdd/:batchName", async (req, res) => {
  const { batchName } = req.params;
  const { students } = req.body; // expects an array of students

  if(!batchName){
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
    s.placement || ""
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
router.get("/student/:bookingId",async(req,res)=>{
    try{
        const { bookingId } = req.params;
        const [rows] = await pool.query("SELECT * FROM students WHERE bookingId = ?", [bookingId]);
        if(rows.length === 0){
            return res.status(404).json({error:"Student not found"});
        }
        res.json(rows[0]);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:"Internal Server Error"});
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
      return res.status(404).json({ error: "No students found for this batch" });
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




module.exports = router;