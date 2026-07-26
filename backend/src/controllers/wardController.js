const Ward = require('../models/Ward');

// Get all wards
exports.findAll = async (req, res) => {
  try {
    const wards = await Ward.findAll();
    res.json(wards);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get ward by ID
exports.findById = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({ error: 'Ward not found' });
    }
    res.json(ward);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new ward (admin only)
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const ward = await Ward.create(name);
    res.status(201).json({
      message: 'Ward created successfully',
      ward
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update ward (admin only)
exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    const ward = await Ward.update(req.params.id, name);
    if (!ward) {
      return res.status(404).json({ error: 'Ward not found' });
    }
    res.json({
      message: 'Ward updated successfully',
      ward
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete ward (admin only)
exports.delete = async (req, res) => {
  try {
    const ward = await Ward.delete(req.params.id);
    if (!ward) {
      return res.status(404).json({ error: 'Ward not found' });
    }
    res.json({
      message: 'Ward deleted successfully',
      ward
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};