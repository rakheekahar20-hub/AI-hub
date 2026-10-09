const express = require('express');
const router = express.Router();
const { handleOAuth, getRepos } = require('../controllers/githubController');

router.get('/auth', handleOAuth);
router.get('/repos', getRepos);
+module.exports = router;