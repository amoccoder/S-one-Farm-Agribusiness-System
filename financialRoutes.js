const express = require('express');
const router = express.Router();

// Financial routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Get financial data' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create financial record' });
});

module.exports = router;
