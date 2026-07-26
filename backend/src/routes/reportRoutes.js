const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/businesses-per-ward', reportController.businessesPerWard);
router.get('/monthly-registrations', reportController.monthlyRegistrations);
router.get('/export', reportController.exportAll);

module.exports = router;