const crypto = require('crypto');
const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Generate short random roomId e.g. "abc-123-xyz" or 8 hex chars
    const roomId = crypto.randomBytes(4).toString('hex');

    const room = await Room.create({
      roomId,
      name: name.trim(),
      createdBy: req.user._id
    });

    res.status(201).json(room);
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId }).populate('createdBy', 'name email');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (err) {
    console.error('Get room error:', err);
    res.status(500).json({ error: 'Failed to get room' });
  }
};

