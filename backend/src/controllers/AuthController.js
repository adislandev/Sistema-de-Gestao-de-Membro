const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Função para registrar um novo usuário
const register = async (req, res) => {
  const { username, password } = req.body;

  // Validação básica
  if (!username || !password) {
    return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
  }

  try {
    // Verifica se o usuário já existe
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Nome de usuário já está em uso.' }); // 409 Conflict
    }

    // Hash da senha com Argon2
    const hashedPassword = await argon2.hash(password);

    // Insere o novo usuário no banco (usando coluna 'password')
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)', // <--- MUDANÇA: Garante que insere na coluna 'password' e adiciona role default
      [username, hashedPassword, 'user'] // Assumindo 'user' como role padrão
    );

    console.log(`Usuário registrado com ID: ${result.insertId}`);
    res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: result.insertId });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.' });
  }
};

// Função para logar um usuário
const login = async (req, res) => {
  const { username, password: plainPassword } = req.body;

  if (!username || !plainPassword) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = users[0];

    // Compara a senha fornecida com o hash armazenado usando Argon2
    let isMatch = false;
    try {
        isMatch = await argon2.verify(user.password, plainPassword);
    } catch (verifyError) {
        // Log específico para erro de verificação pode ser útil, mas menos verboso
        console.error('[AuthController LOGIN] Error during argon2.verify for user:', username, verifyError.message);
        return res.status(500).json({ message: 'Erro interno ao verificar a senha.' });
    }

    if (!isMatch) {
      // Log de falha de senha é útil
      console.log(`[AuthController LOGIN] Password mismatch for user: ${username}`);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gera o token JWT
    const payload = {
      userId: user.id,
      role: user.role // <-- Usa a role do objeto user
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    const responseUserObject = {
      id: user.id,
      username: user.username,
      role: user.role // <-- Usa a role do objeto user novamente
    };

    res.json({ 
      message: 'Login bem-sucedido',
      token,
      user: responseUserObject // Envia o objeto
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
      return res.status(500).json({ message: 'Erro no banco de dados ao tentar fazer login.' }); 
    }
    if (error.code === 'ERR_ARGON2_INVALID_HASH') {
        console.error('Argon2 Error:', error.message);
        return res.status(500).json({ message: 'Erro interno ao verificar credenciais.' });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao fazer login' });
  }
};

// ADICIONAR: Função para registrar um novo administrador (temporário)
const registerAdmin = async (req, res) => {
  console.log('>>> DEBUG: Função registerAdmin foi chamada'); // Manter log por enquanto
  const { name, email, password } = req.body; // email será usado como username

  // Validação básica
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email (usado como username) e senha são obrigatórios.' });
  }

  // Validação simples de email (mantém, pois o formato deve ser de email)
  if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Formato de email inválido (será usado como username).' });
  }

  // Validação de força da senha (mantém)
  if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    // MODIFICAR: Verifica se o USERNAME (que é o email) já existe
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [email]); 
    if (existingUsers.length > 0) {
      // MODIFICAR: Mensagem de erro
      return res.status(409).json({ message: 'Nome de usuário (email) já está em uso.' }); 
    }

    // Hash da senha com Argon2 (mantém)
    const hashedPassword = await argon2.hash(password);

    // MODIFICAR: Insere o novo usuário SEM a coluna 'name'
    // Assumindo que a tabela users tem colunas: username, password, role
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)', // Remove 'name' da query
      [email, hashedPassword, 'admin'] // Remove 'name' dos valores
    );

    console.log(`Administrador registrado com ID: ${result.insertId}`);
    res.status(201).json({ message: 'Administrador registrado com sucesso!', userId: result.insertId });

  } catch (error) {
    console.error('Erro ao registrar administrador:', error);
    // Verifica se é um erro de constraint (ex: username único)
    if (error.code === 'ER_DUP_ENTRY') {
        // MODIFICAR: Mensagem de erro
        return res.status(409).json({ message: 'Nome de usuário (email) já está em uso.' });
    } 
    if (error.sqlMessage) {
        console.error('SQL Error:', error.sqlMessage);
    }
    res.status(500).json({ message: 'Erro interno do servidor ao registrar administrador.' });
  }
};

module.exports = {
  register,
  login,
  registerAdmin
}; 