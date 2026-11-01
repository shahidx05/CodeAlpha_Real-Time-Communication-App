const express = require('express');
const router = express.Router();
const multer = require('multer');
const roomController = require('../controllers/roomController');
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

router.use(authenticateToken);

router.post('/', roomController.createRoom);
router.get('/:roomId', roomController.getRoom);
router.post('/:roomId/files', upload.single('file'), fileController.uploadFile);
router.get('/:roomId/files', fileController.getRoomFiles);

module.exports = router;

