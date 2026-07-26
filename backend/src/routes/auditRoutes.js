const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All audit routes require authentication and admin role
router.use(auth);
router.use(roleCheck('admin'));

router.get('/', auditController.getLogs);
router.get('/stats', auditController.getStats);
router.get('/user-activity', auditController.getUserActivity);
router.delete('/clean', auditController.cleanLogs);

module.exports = router;