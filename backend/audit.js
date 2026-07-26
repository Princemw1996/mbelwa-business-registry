const AuditLog = require('../models/AuditLog');

/**
 * Audit middleware - logs all actions to audit_logs table
 */
const auditLog = (action, tableName, getRecordId = null) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send to capture response data
    res.send = function(data) {
      // Only log if we have a user
      if (req.user && req.user.id) {
        let recordId = null;
        let newData = null;
        let oldData = null;
        
        // Try to get record ID from request params or response
        if (req.params && req.params.id) {
          recordId = parseInt(req.params.id);
        } else if (getRecordId) {
          recordId = getRecordId(req);
        }
        
        // Try to get data from request body or response
        if (req.body && Object.keys(req.body).length > 0) {
          newData = req.body;
        }
        
        // Try to parse response data
        try {
          const responseData = JSON.parse(data);
          if (responseData && responseData.data) {
            newData = responseData.data;
          }
        } catch (e) {
          // Not JSON, ignore
        }
        
        // Log the action
        AuditLog.create({
          user_id: req.user.id,
          user_name: req.user.name || 'Unknown',
          action: action,
          table_name: tableName,
          record_id: recordId,
          old_data: req.oldData || null,
          new_data: newData,
          ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: req.headers['user-agent'] || null
        }).catch(err => console.error('Audit log error:', err));
      }
      
      // Call original send
      originalSend.call(this, data);
    };
    
    // Store old data if we're updating
    if (req.params && req.params.id && (action === 'UPDATE' || action === 'DELETE')) {
      // Fetch current data before modification
      const pool = require('../config/db');
      try {
        const result = await pool.query(
          `SELECT * FROM ${tableName} WHERE id = $1`,
          [parseInt(req.params.id)]
        );
        if (result.rows[0]) {
          req.oldData = result.rows[0];
        }
      } catch (e) {
        // Table might not exist or other error
        console.error('Error fetching old data for audit:', e);
      }
    }
    
    next();
  };
};

module.exports = auditLog;