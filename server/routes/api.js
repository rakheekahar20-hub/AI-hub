const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');

router.get('/features', featureController.getFeatures);
router.post('/features', featureController.createFeature);

module.exports = router;