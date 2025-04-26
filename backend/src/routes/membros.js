const express = require('express');
const router = express.Router();
const membroController = require('../controllers/membroController');
const authenticateToken = require('../middleware/authMiddleware'); // Importa o middleware real

// Aplicar middleware de autenticação a TODAS as rotas definidas neste router
// Garantindo que apenas usuários logados possam interagir com membros.
router.use(authenticateToken); 

// Definir as rotas

// GET /api/membros - Listar membros com filtros e paginação
router.get('/', membroController.getAllMembros);

// POST /api/membros - Criar novo membro
router.post('/', membroController.createMembro);

// PUT /api/membros/:id - Atualizar membro por ID
router.put('/:id', membroController.updateMembro);

// DELETE /api/membros/:id - Excluir membro por ID
router.delete('/:id', membroController.deleteMembro);

// Adicionar futuramente: GET /:id

module.exports = router; 