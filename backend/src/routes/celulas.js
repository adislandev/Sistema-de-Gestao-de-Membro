const express = require('express');
const router = express.Router();
const celulaController = require('../controllers/celulaController');
const authenticateToken = require('../middleware/authMiddleware');

// Aplica autenticação a todas as rotas de células
router.use(authenticateToken);

// GET /api/celulas - Listar todas
router.get('/', celulaController.getAllCelulas);

// POST /api/celulas - Criar nova
router.post('/', celulaController.createCelula);

// PUT /api/celulas/:id - Atualizar por ID
router.put('/:id', celulaController.updateCelula);

// DELETE /api/celulas/:id - Excluir por ID
router.delete('/:id', celulaController.deleteCelula);

// Adicionar futuramente: GET /:id

module.exports = router; 