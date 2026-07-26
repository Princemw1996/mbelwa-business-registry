const express = require('express');
const router = express.Router();
const wardController = require('../controllers/wardController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All ward routes require authentication
router.use(auth);

// Everyone can view wards
router.get('/', wardController.findAll);
router.get('/:id', wardController.findById);

// Only admins can modify wards
router.post('/', roleCheck('admin'), wardController.create);
router.put('/:id', roleCheck('admin'), wardController.update);
router.delete('/:id', roleCheck('admin'), wardController.delete);

module.exports = router;