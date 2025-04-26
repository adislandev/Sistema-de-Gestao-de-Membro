const express = require('express');
const { getMe, changePassword, getAllUsers, deleteUser, createUserByAdmin, updateUserByAdmin } = require('../controllers/UserController');
const authenticateToken = require('../middleware/authMiddleware');
const checkAdminRole = require('../middleware/checkAdminRole');

const router = express.Router();

// Rota para obter dados do usuário logado
// GET /api/users/me
// Primeiro executa o middleware authenticateToken, se ele chamar next(), executa getMe
router.get('/me', authenticateToken, getMe);

// Rota para alterar a senha do usuário logado
// PUT /api/users/change-password
router.put('/change-password', authenticateToken, changePassword);

// Rota para listar todos os usuários
// GET /api/users
// Protegida por autenticação E por papel de admin
router.get('/', authenticateToken, checkAdminRole, getAllUsers);

// Adicione outras rotas relacionadas a usuários aqui (ex: updateProfile, etc.)
// Lembre-se de adicionar authenticateToken se a rota exigir login

// --- ADICIONADO: Rota de Exclusão (Admin) ---
// DELETE /api/users/:id - Excluir um usuário específico
router.delete('/:id', authenticateToken, checkAdminRole, deleteUser);

// --- Rotas de Gerenciamento (Admin) ---
router.post('/', authenticateToken, checkAdminRole, createUserByAdmin); // Criar usuário
router.put('/:id', authenticateToken, checkAdminRole, updateUserByAdmin); // Editar usuário (username, role)

module.exports = router; 