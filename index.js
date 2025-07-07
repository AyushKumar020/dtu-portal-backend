// Description: This is the backend server for the DTU Portal application.
// It connects to a PostgreSQL database and serves API endpoints for the frontend. 
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*'
}));

app.use(express.json());

// ✅ Create pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ Test DB connection route
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err.message);
    res.status(500).send('Server Error');
  }
});

// ✅ Default root route
app.get('/', (req, res) => {
  res.send('Hello from DTU Portal Backend');
});

// ✅ 1. Get student by roll number
app.get('/api/students/roll/:roll_no', async (req, res) => {
  const { roll_no } = req.params;
  try {
    const result = await pool.query('SELECT * FROM students WHERE roll_no = $1', [roll_no]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching student by roll_no:', err.message);
    res.status(500).send('Server Error');
  }
});

// ✅ 2. Get all results for a student (with subject details)
app.get('/api/results/:student_id', async (req, res) => {
  const { student_id } = req.params;
  try {
    const query = `
      SELECT r.semester, s.code AS subject_code, s.name AS subject_name, s.credits, r.grade
      FROM results r
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.student_id = $1
      ORDER BY r.semester, s.code
    `;
    const result = await pool.query(query, [student_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching results:', err.message);
    res.status(500).send('Server Error');
  }
});

// ✅ 3. Get SGPA data for a student
app.get('/api/sgpa/:student_id', async (req, res) => {
  const { student_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT semester, sgpa, total_credits FROM sgpa WHERE student_id = $1 ORDER BY semester',
      [student_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching SGPA:', err.message);
    res.status(500).send('Server Error');
  }
});


// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
