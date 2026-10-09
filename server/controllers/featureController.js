const pool = require('../db/pool');

exports.getFeatures = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM features ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createFeature = async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await pool.query('INSERT INTO features (title, description) VALUES ($1, $2) RETURNING *', [title, description]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};