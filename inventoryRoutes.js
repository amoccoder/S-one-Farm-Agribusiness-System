const express = require('express');
const router = express.Router();

// Inventory routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Get inventory' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create inventory item' });
});

module.exports = router;
