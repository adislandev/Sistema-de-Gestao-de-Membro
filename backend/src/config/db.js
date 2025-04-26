const mysql = require('mysql2/promise');
// require('dotenv').config({ path: '../../.env' }); // REMOVIDO: dotenv deve ser carregado apenas no server.js

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'ieqmembro',
  waitForConnections: true,
  connectionLimit: 10,

   // Limite de conexões no pool
});

// Testa a conexão (opcional, mas bom para verificar na inicialização)
pool.getConnection()
  .then(connection => {
    console.log('Conexão com o banco de dados MySQL estabelecida com sucesso!');
    connection.release(); // Libera a conexão de volta para o pool
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco de dados:', err.message);
    // Em um cenário real, você pode querer encerrar a aplicação ou tentar reconectar
    // process.exit(1); 
  });

module.exports = pool; 