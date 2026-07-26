const AuditLog = require('../models/AuditLog');

// Get all audit logs with filters
exports.getLogs = async (req, res) => {
  try {
    const filters = req.query;
    const logs = await AuditLog.findAll(filters);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get audit log statistics
exports.getStats = async (req, res) => {
  try {
    const stats = await AuditLog.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user activity summary
exports.getUserActivity = async (req, res) => {
  try {
    const activity = await AuditLog.getUserActivity();
    res.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Clean old logs (admin only)
exports.cleanLogs = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const count = await AuditLog.cleanOldLogs(parseInt(days));
    res.json({
      message: `Cleaned ${count} old log entries`,
      deleted: count
    });
  } catch (error) {
    console.error('Error cleaning logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
};