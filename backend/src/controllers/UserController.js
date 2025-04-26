const pool = require('../config/db');
// REMOVER: bcrypt não será mais usado aqui
// const bcrypt = require('bcrypt');
// ADICIONAR: Importa argon2
const argon2 = require('argon2');

// REMOVER: SALT_ROUNDS era para bcrypt
// const SALT_ROUNDS = 10;

// Função para obter dados do usuário logado (exemplo)
const getMe = async (req, res) => {
  // O middleware authenticateToken já validou o token 
  // e anexou o payload do usuário (incluindo userId) a req.user
  const userId = req.user.userId;

  console.log(`[UserController] Buscando dados para userId: ${userId} (obtido do token)`);

  try {
    // Busca dados adicionais do usuário no banco (exemplo: username, created_at)
    // Evita selecionar o password_hash!
    const [users] = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      // Isso não deveria acontecer se o token for válido, mas é uma boa verificação
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(users[0]); // Retorna os dados do usuário

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar dados do usuário.' });
  }
};

// Função para alterar a senha do usuário logado
const changePassword = async (req, res) => {
  const userId = req.user.userId; // Obtido pelo middleware authenticateToken
  const { currentPassword, newPassword } = req.body;

  console.log(`[UserController] Tentativa de alteração de senha para userId: ${userId}`);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
  }

  try {
    // Usa a coluna 'password'
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado (apesar do token válido?).' });
    }
    const storedHash = users[0].password;

    // CORREÇÃO: Usa argon2.verify para comparar
    const isMatch = await argon2.verify(storedHash, currentPassword); 
    if (!isMatch) {
      console.log(`[UserController] Tentativa de alteração de senha falhou para userId: ${userId} (Senha atual incorreta)`);
      return res.status(400).json({ message: 'Senha atual incorreta.' });
    }

    // CORREÇÃO: Usa argon2.hash para gerar o novo hash
    const newHashedPassword = await argon2.hash(newPassword);

    // Atualiza a coluna 'password'
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newHashedPassword, userId]);

    console.log(`[UserController] Senha alterada com sucesso para userId: ${userId}`);
    res.status(200).json({ message: 'Senha alterada com sucesso!' });

  } catch (error) {
    // Log de erro mais específico para Argon2, se aplicável
    if (error.code && error.code.startsWith('ERR_ARGON2')) {
        console.error(`[UserController] Erro do Argon2 ao alterar senha para userId: ${userId}:`, error.message);
        return res.status(500).json({ message: 'Erro interno do servidor ao processar a senha.' });
    }
    console.error(`[UserController] Erro genérico ao alterar senha para userId: ${userId}:`, error);
    res.status(500).json({ message: 'Erro interno do servidor ao alterar a senha.' });
  }
};

// Função para listar todos os usuários (apenas Admin)
const getAllUsers = async (req, res) => {
  console.log('[UserController] Tentativa de listar todos os usuários (Admin).');
  try {
    // Seleciona campos relevantes, NUNCA o password_hash
    const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
    res.status(200).json(users);
  } catch (error) {
    console.error('[UserController] Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar usuários.' });
  }
};

// Função para excluir um usuário (apenas Admin)
const deleteUser = async (req, res) => {
  const adminUserId = req.user.userId; // ID do admin fazendo a requisição
  const userIdToDelete = parseInt(req.params.id, 10); // ID do usuário a ser excluído (da URL)

  console.log(`[UserController] Admin (ID: ${adminUserId}) tentando excluir usuário (ID: ${userIdToDelete})`);

  // Validação básica do ID
  if (isNaN(userIdToDelete)) {
    return res.status(400).json({ message: 'ID de usuário inválido.' });
  }

  // Impede que o admin exclua a si mesmo
  if (adminUserId === userIdToDelete) {
    console.log(`[UserController] Admin (ID: ${adminUserId}) tentou se auto-excluir.`);
    return res.status(400).json({ message: 'Administradores não podem excluir a si mesmos.' });
  }

  try {
    // Executa a exclusão
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userIdToDelete]);

    // Verifica se alguma linha foi afetada (se o usuário existia)
    if (result.affectedRows === 0) {
      console.log(`[UserController] Tentativa de excluir usuário (ID: ${userIdToDelete}) falhou (não encontrado).`);
      return res.status(404).json({ message: 'Usuário não encontrado para exclusão.' });
    }

    console.log(`[UserController] Usuário (ID: ${userIdToDelete}) excluído com sucesso pelo Admin (ID: ${adminUserId}).`);
    // Retorna 204 No Content, que é apropriado para DELETE bem-sucedido sem corpo de resposta
    res.sendStatus(204); 

  } catch (error) {
    console.error(`[UserController] Erro ao excluir usuário (ID: ${userIdToDelete}):`, error);
    res.status(500).json({ message: 'Erro interno do servidor ao excluir usuário.' });
  }
};

// Função para criar um novo usuário (apenas Admin)
const createUserByAdmin = async (req, res) => {
  const { username, password, role } = req.body;
  const adminUserId = req.user.userId;

  console.log(`[UserController] Admin (ID: ${adminUserId}) tentando criar usuário: ${username} com papel ${role}`);

  // Validação de entrada
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Nome de usuário, senha e papel são obrigatórios.' });
  }
  // CORRIGIR: Usar os roles definidos no ENUM do banco ('admin', 'member')
  const allowedRoles = ['admin', 'member']; 
  const lowerCaseRole = role.toLowerCase(); // Converte para minúscula uma vez

  if (!allowedRoles.includes(lowerCaseRole)) {
      return res.status(400).json({ message: `Papel inválido. Papéis permitidos: ${allowedRoles.join(', ')}` });
  }

  try {
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Nome de usuário já está em uso.' });
    }

    const hashedPassword = await argon2.hash(password);

    // CORRIGIR: Garante que o valor inserido é o validado em minúsculas ('admin' ou 'member')
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, lowerCaseRole] 
    );

    console.log(`[UserController] Usuário (ID: ${result.insertId}, Username: ${username}, Role: ${lowerCaseRole}) criado com sucesso pelo Admin (ID: ${adminUserId}).`);
    
    // Retorna os dados do usuário criado 
    res.status(201).json({ 
        id: result.insertId, 
        username: username, 
        // CORRIGIR: Retorna o valor que foi realmente inserido (lowerCaseRole)
        role: lowerCaseRole 
    });

  } catch (error) {
    console.error('[UserController] Erro ao criar usuário pelo admin:', error);
    // Adicionar tratamento específico para erro de ENUM inválido, se possível
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || (error.sqlMessage && error.sqlMessage.includes('for column \'role\''))) {
         console.error('[UserController] Tentativa de inserir valor inválido no ENUM role.');
         return res.status(400).json({ message: 'Valor inválido fornecido para o papel do usuário.'});
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar usuário.' });
  }
};

// Função para atualizar um usuário (apenas Admin)
const updateUserByAdmin = async (req, res) => {
    const userIdToUpdate = parseInt(req.params.id, 10);
    // ADICIONAR: Pega a senha opcional do body
    const { username, role, password } = req.body; 
    const adminUserId = req.user.userId;

    console.log(`[UserController] Admin (ID: ${adminUserId}) tentando atualizar usuário (ID: ${userIdToUpdate}) com dados:`, { username, role, password: password ? '******' : 'N/A' }); // Log sem expor senha

    // Validação de entrada
    if (isNaN(userIdToUpdate)) {
        return res.status(400).json({ message: 'ID de usuário inválido.' });
    }
    // Username e role continuam obrigatórios
    if (!username || !role) { 
        return res.status(400).json({ message: 'Nome de usuário e papel são obrigatórios.' });
    }
    const allowedRoles = ['user', 'admin'];
    if (!allowedRoles.includes(role.toLowerCase())) {
        return res.status(400).json({ message: `Papel inválido. Papéis permitidos: ${allowedRoles.join(', ')}` });
    }
    // Nota: Não estamos validando a senha aqui, assumindo que o frontend já fez (ex: confirmação)
    // Se a senha for enviada, ela será atualizada.

    try {
        // Verifica se o novo username já está em uso por OUTRO usuário
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, userIdToUpdate]
        );
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Nome de usuário já está em uso por outro usuário.' });
        }

        // Lógica para atualizar com ou sem senha
        let sqlQuery = '';
        let queryParams = [];

        if (password && password.trim() !== '') {
            // Se uma nova senha foi fornecida, hasheia e inclui na query
            console.log(`[UserController] Nova senha fornecida para usuário ID: ${userIdToUpdate}. Gerando hash...`);
            const hashedPassword = await argon2.hash(password);
            sqlQuery = 'UPDATE users SET username = ?, role = ?, password = ? WHERE id = ?';
            queryParams = [username, role.toLowerCase(), hashedPassword, userIdToUpdate];
        } else {
            // Se nenhuma senha foi fornecida, atualiza apenas username e role
            console.log(`[UserController] Nenhuma nova senha fornecida para usuário ID: ${userIdToUpdate}. Atualizando apenas username e role.`);
            sqlQuery = 'UPDATE users SET username = ?, role = ? WHERE id = ?';
            queryParams = [username, role.toLowerCase(), userIdToUpdate];
        }

        // Executa a atualização
        const [result] = await pool.query(sqlQuery, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado para atualização.' });
        }

        console.log(`[UserController] Usuário (ID: ${userIdToUpdate}) atualizado com sucesso pelo Admin (ID: ${adminUserId}). Senha ${password ? 'atualizada' : 'não alterada'}.`);
        res.status(200).json({ message: 'Usuário atualizado com sucesso!' });

    } catch (error) {
        // Adiciona log de erro específico do Argon2 se ocorrer durante o hash
        if (error.code && error.code.startsWith('ERR_ARGON2')) {
             console.error(`[UserController] Erro do Argon2 ao hashear nova senha para usuário ID: ${userIdToUpdate}:`, error.message);
            return res.status(500).json({ message: 'Erro interno do servidor ao processar a nova senha.' });
        }
        console.error(`[UserController] Erro ao atualizar usuário (ID: ${userIdToUpdate}):`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar usuário.' });
    }
};

module.exports = {
  getMe,
  changePassword, // Exporta a nova função
  getAllUsers, // Exporta a nova função
  deleteUser, // Exporta a nova função
  createUserByAdmin, // Exporta a nova função
  updateUserByAdmin, // Exporta a nova função
}; 