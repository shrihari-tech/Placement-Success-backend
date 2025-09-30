const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

const DEFAULT_PASSWORD = "Welcome@123";

//Get all users
router.get("/all", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, phone, role, created_at, updated_at FROM users ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

//Create new user
router.post("/create", async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, role, password) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, role, hashedPassword]
    );

    const [newUser] = await pool.query("SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ?", [result.insertId]);

    res.status(201).json(newUser[0]);
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: "Failed to create user" });
  }
});

//Update user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    await pool.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?",
      [name, email, phone, role, id]
    );

    const [updatedUser] = await pool.query("SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ?", [id]);

    res.json(updatedUser[0]);
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;