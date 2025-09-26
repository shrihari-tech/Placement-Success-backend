const router = require("express").Router();
const pool = require("../db");

//create a user
router.post("/createUser", async (req, res) => {
  try {
    const { key, label } = req.body;
    if (!key || !label) {
      return res.status(400).json({ error: "Both key and label are required" });
    }
    const [result] = await pool.query("INSERT INTO user (`key`, label) VALUES (?, ?)",[key, label]);
    res.status(201).json({ message: "User Type created successfully", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// get all user types
router.get("/allUsers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM user");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get user type by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM user WHERE id = ?", [id]);
        if (rows.length === 0) {
          return res.status(404).json({ error: "User Type not found" });
        }
        res.json(rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// update user type by id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
    const { key, label } = req.body;
    try {
        const [result] = await pool.query("UPDATE user SET `key` = ?, label = ? WHERE id = ?",[key, label, id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User Type not found" });
        }
        res.json({ message: "User Type updated successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;