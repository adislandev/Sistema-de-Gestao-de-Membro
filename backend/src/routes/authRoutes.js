const express = require('express');
const { register, login } = require('../controllers/AuthController');

const router = express.Router();

// Rota para registrar um novo usuário
// POST /api/auth/register
// router.post('/register', register); // <-- ROTA COMENTADA/DESABILITADA

// Rota para autenticar um usuário (login)
// POST /api/auth/login
router.post('/login', login);

module.exports = router; 