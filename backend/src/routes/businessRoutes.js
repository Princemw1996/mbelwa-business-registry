const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All business routes require authentication
router.use(auth);

// ===== NEW: Get businesses grouped by user (must be BEFORE /:id) =====
router.get('/by-user', businessController.getBusinessesByUser);

// Search owners
router.get('/owners/search', businessController.searchOwners);

// Public (viewers can read, clerks can create)
router.get('/', businessController.findAll);
router.get('/:id', businessController.findById);

// Clerks and admins can create and update
router.post('/', roleCheck('admin', 'clerk'), businessController.create);
router.put('/:id', roleCheck('admin', 'clerk'), businessController.update);

// Only admins can delete (close) a business
router.delete('/:id', roleCheck('admin'), businessController.delete);

module.exports = router;