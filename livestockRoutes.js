const express = require('express');
const router = express.Router();

// Livestock routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Get livestock' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create livestock record' });
});

module.exports = router;
