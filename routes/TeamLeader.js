// routes/teamLeader.js
const router = require("express").Router();
const pool = require("../db");

// Utility: Validate required fields
const validateTLFields = (data, requiredFields = ['name', 'email', 'phone']) => {
  const errors = {};
  let isValid = true;

  requiredFields.forEach(field => {
    if (!data[field] || data[field].trim() === '') {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      isValid = false;
    }
  });

  // Email format validation
  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Invalid email format';
      isValid = false;
    }
  }

  // Phone validation (10 digits, starts with 6-9)
  if (data.phone && data.phone.trim()) {
    const phone = data.phone.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.phone = 'Phone must be 10 digits and start with 6-9';
      isValid = false;
    }
  }

  // Password validation (if provided)
  if (data.password && data.password.trim() !== '' && data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
    isValid = false;
  }

  return { isValid, errors };
};

// ➤ POST /team-leaders — Create a new Team Leader
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, role = 'Placement TL', password = 'welcome123' } = req.body;

    // Validate input
    const { isValid, errors } = validateTLFields({ name, email, phone, password });
    if (!isValid) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM team_leaders WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate ID (using timestamp string as in your frontend)
    const id = Date.now().toString();

    // Insert into database
    const [result] = await pool.query(
      `INSERT INTO team_leaders (id, name, email, phone, role, password) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), email.trim(), phone.trim(), role, password]
    );

    // Return success response
    res.status(201).json({
      id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      message: 'Team Leader created successfully'
    });

  } catch (error) {
    console.error('POST /team-leaders Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ➤ GET /team-leaders — Get all Team Leaders (sorted newest first)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM team_leaders ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('GET /team-leaders Error:', error);
    res.status(500).json({ error: 'Failed to fetch team leaders' });
  }
});

// ➤ GET /team-leaders/:id — Get single Team Leader by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM team_leaders WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Team Leader not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('GET /team-leaders/:id Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ➤ PUT /team-leaders/:id — Update Team Leader
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password } = req.body;

    // Check if TL exists
    const [existing] = await pool.query('SELECT * FROM team_leaders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Team Leader not found' });
    }

    // Validate fields if provided
    const dataToValidate = {};
    if (name !== undefined) dataToValidate.name = name;
    if (email !== undefined) dataToValidate.email = email;
    if (phone !== undefined) dataToValidate.phone = phone;
    if (password !== undefined) dataToValidate.password = password;

    const { isValid, errors } = validateTLFields(dataToValidate, 
      Object.keys(dataToValidate).filter(f => f !== 'password') // Don't require password
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // If email is being changed, check uniqueness
    if (email && email !== existing[0].email) {
      const [emailExists] = await pool.query('SELECT id FROM team_leaders WHERE email = ? AND id != ?', [email, id]);
      if (emailExists.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name.trim()); }
    if (email !== undefined) { updateFields.push('email = ?'); updateValues.push(email.trim()); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone.trim()); }
    if (role !== undefined) { updateFields.push('role = ?'); updateValues.push(role); }
    if (password !== undefined && password.trim() !== '') { 
      updateFields.push('password = ?'); 
      updateValues.push(password); 
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id); // Add ID for WHERE clause

    await pool.query(
      `UPDATE team_leaders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Return updated TL
    const [updated] = await pool.query('SELECT * FROM team_leaders WHERE id = ?', [id]);
    res.status(200).json({
      ...updated[0],
      message: 'Team Leader updated successfully'
    });

  } catch (error) {
    console.error('PUT /team-leaders/:id Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ➤ DELETE /team-leaders/:id — Delete Team Leader
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if exists
    const [existing] = await pool.query('SELECT name FROM team_leaders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Team Leader not found' });
    }

    // Delete
    await pool.query('DELETE FROM team_leaders WHERE id = ?', [id]);

    res.status(200).json({
      message: `Team Leader ${existing[0].name} deleted successfully`,
      deletedId: id
    });

  } catch (error) {
    console.error('DELETE /team-leaders/:id Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;