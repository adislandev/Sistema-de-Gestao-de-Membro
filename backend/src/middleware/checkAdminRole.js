const checkAdminRole = (req, res, next) => {
  // Assumimos que o middleware authenticateToken rodou ANTES deste
  // e anexou o payload do usuário (incluindo o role) a req.user.

  if (!req.user) {
    // Se por algum motivo req.user não existir (erro anterior ou middleware não aplicado)
    console.error('[checkAdminRole] Erro: req.user não encontrado. O middleware authenticateToken rodou antes?');
    return res.sendStatus(401); // Não autorizado (ou 500 Internal Server Error)
  }

  const userRole = req.user.role;
  console.log(`[checkAdminRole] Verificando papel do usuário: ${userRole}`);

  if (userRole && userRole.toLowerCase() === 'admin') {
    // Se o papel for 'admin', permite continuar
    console.log('[checkAdminRole] Acesso de administrador concedido.');
    next(); 
  } else {
    // Se não for 'admin', retorna erro 403 (Proibido)
    console.log('[checkAdminRole] Acesso negado. Papel não é admin.');
    return res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
  }
};

module.exports = checkAdminRole; 