const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');

// TODO: Importar e aplicar o middleware de autenticação real
// Exemplo: const authenticateToken = require('../middleware/authMiddleware');
const authenticateTokenPlaceholder = (req, res, next) => {
    // Lógica de placeholder - substitua pelo seu middleware real!
    console.log('[Auth Middleware Placeholder] Verificando token...');
    // Exemplo: Verificar req.user ou similar que seu middleware real define
    if (true) { // Simula autenticação bem-sucedida
        next(); 
    } else {
        res.sendStatus(401); // Não autorizado
    }
};

// Aplicar middleware de autenticação a TODAS as rotas de departamentos
router.use(authenticateTokenPlaceholder); 

// Definir as rotas e associá-las às funções do controller

// GET /api/departamentos - Listar todos
router.get('/', departamentoController.getAllDepartamentos);

// POST /api/departamentos - Criar novo
router.post('/', departamentoController.createDepartamento);

// PUT /api/departamentos/:id - Atualizar por ID
router.put('/:id', departamentoController.updateDepartamento);

// DELETE /api/departamentos/:id - Excluir por ID
router.delete('/:id', departamentoController.deleteDepartamento);

// --- Rotas para Gerenciamento de Membros do Departamento --- //

// GET /api/departamentos/:id/membros - Lista todos os membros indicando pertencimento
router.get('/:id/membros', departamentoController.getDepartamentoMembers);

// PUT /api/departamentos/:id/membros - Atualiza a lista de membros do departamento
router.put('/:id/membros', departamentoController.updateDepartamentoMembers);

module.exports = router; 