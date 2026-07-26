const Business = require('../models/Business');

// Get business count per ward
exports.businessesPerWard = async (req, res) => {
  try {
    const data = await Business.countPerWard();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get monthly registration count
exports.monthlyRegistrations = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const data = await Business.countPerMonth(year);
    res.json({
      year,
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Export all businesses (for CSV/Excel generation later)
exports.exportAll = async (req, res) => {
  try {
    const businesses = await Business.findAll({});
    res.json({
      total: businesses.length,
      businesses
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};