const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FileRecord = require('../models/FileRecord');
const { encryptBuffer, decryptBuffer } = require('../utils/crypto');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

exports.uploadFile = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // Encrypt file buffer with AES-256-GCM
    const { encrypted, iv, authTag } = encryptBuffer(buffer);

    const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.enc`;
    const filePath = path.join(UPLOADS_DIR, storedName);

    await fs.promises.writeFile(filePath, encrypted);

    const fileRecord = await FileRecord.create({
      room: roomId,
      originalName: originalname,
      storedName,
      mimeType: mimetype || 'application/octet-stream',
      size,
      uploadedBy: req.user._id,
      iv,
      authTag
    });

    const populated = await fileRecord.populate('uploadedBy', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

exports.getRoomFiles = async (req, res) => {
  try {
    const { roomId } = req.params;
    const files = await FileRecord.find({ room: roomId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (err) {
    console.error('Get room files error:', err);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const fileRecord = await FileRecord.findById(id);

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(UPLOADS_DIR, fileRecord.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Stored file not found on disk' });
    }

    const encryptedBuffer = await fs.promises.readFile(filePath);

    // Decrypt file buffer with AES-256-GCM
    const decryptedBuffer = decryptBuffer(
      encryptedBuffer,
      fileRecord.iv,
      fileRecord.authTag
    );

    res.setHeader('Content-Type', fileRecord.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileRecord.originalName)}"`
    );
    res.setHeader('Content-Length', decryptedBuffer.length);

    res.send(decryptedBuffer);
  } catch (err) {
    console.error('File download error:', err);
    res.status(500).json({ error: 'Failed to decrypt or download file' });
  }
};

