const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' }); // Garante acesso ao JWT_SECRET

const authenticateToken = (req, res, next) => {
  // 1. Pega o token do cabeçalho Authorization
  const authHeader = req.headers['authorization'];
  // O formato esperado é "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Se não houver token, retorna erro 401 (Não Autorizado)
  if (token == null) {
    console.log('[Auth Middleware] Token não encontrado no cabeçalho.');
    return res.sendStatus(401); 
  }

  // 3. Verifica o token usando o segredo
  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    // 4. Se o token for inválido (expirado, assinatura errada), retorna erro 403 (Proibido)
    if (err) {
      console.log('[Auth Middleware] Token inválido:', err.message);
      return res.sendStatus(403); 
    }

    // 5. Se o token for válido, anexa o payload decodificado ao request
    // O payload contém o que colocamos ao criar o token (ex: { userId: ..., username: ... })
    console.log('[Auth Middleware] Token válido. Payload:', userPayload);
    req.user = userPayload; 

    // 6. Chama next() para passar para o próximo middleware ou para a rota final
    next(); 
  });
};

module.exports = authenticateToken; 