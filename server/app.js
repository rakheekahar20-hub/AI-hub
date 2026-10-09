const express = require('express');
const app = express();
const githubRoutes = require('./routes/githubRoutes');

app.use(express.json());
app.use('/api/github', githubRoutes);

module.exports = app;