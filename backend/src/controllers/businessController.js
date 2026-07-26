const Business = require('../models/Business');

// Create a new business
exports.create = async (req, res) => {
  try {
    const businessData = {
      ...req.body,
      created_by: req.userId
    };
    
    const business = await Business.create(businessData, req.user);
    
    res.status(201).json({
      message: 'Business registered successfully',
      business
    });
  } catch (error) {
    console.error('Error creating business:', error);
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'Registration number already exists. Please use a unique number.' 
      });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all businesses
exports.findAll = async (req, res) => {
  try {
    const { ward_id, status, search, from_date, to_date } = req.query;
    const filters = { ward_id, status, search, from_date, to_date };
    
    const businesses = await Business.findAll(filters);
    res.json({
      total: businesses.length,
      businesses
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get business by ID
exports.findById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update business
exports.update = async (req, res) => {
  try {
    const business = await Business.update(
      req.params.id,
      req.body,
      req.userId,
      req.user
    );
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    res.json({
      message: 'Business updated successfully',
      business
    });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete business
exports.delete = async (req, res) => {
  try {
    const business = await Business.delete(req.params.id, req.user);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json({
      message: 'Business closed successfully',
      business
    });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search owners
exports.searchOwners = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json([]);
    }
    const owners = await Business.searchOwners(q);
    res.json(owners);
  } catch (error) {
    console.error('Error searching owners:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== NEW: Get businesses grouped by user =====
exports.getBusinessesByUser = async (req, res) => {
  try {
    const data = await Business.getBusinessesByUser();
    console.log(`📊 Found ${data.length} users with businesses`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching businesses by user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};