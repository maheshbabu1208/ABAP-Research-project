const express = require('express');
const router = express.Router();
const abapController = require('./controllers/abapController');

router.post('/run', abapController.runAbapCode);

module.exports = router;
