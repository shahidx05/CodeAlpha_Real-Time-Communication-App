const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/:id/download', fileController.downloadFile);

module.exports = router;

