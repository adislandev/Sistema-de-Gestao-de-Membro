-- Inserção do usuário administrador inicial
-- IMPORTANTE: Substitua 'HASH_DA_SENHA_AQUI' pelo hash bcrypt gerado para a senha 'admin123'
INSERT INTO users (username, password, role) 
VALUES ('admin', 'HASH_DA_SENHA_AQUI', 'admin')
ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role); -- Atualiza caso o usuário 'admin' já exista 