const pool = require('../db');

exports.findUser = async (id) => {
  return pool.query('SELECT * FROM users WHERE id = $1', [id]);
};

exports.linkGithub = async (userId, token) => {
  // implementation for linking github
};