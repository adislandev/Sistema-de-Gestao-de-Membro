const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/summaryController');
const authenticateToken = require('../middleware/authMiddleware');

// Rota para obter contagens de resumo (protegida por autenticação)
router.get('/', authenticateToken, getSummary);

module.exports = router; 