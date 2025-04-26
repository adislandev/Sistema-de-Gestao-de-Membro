require('dotenv').config(); // Carrega .env do diretório atual (backend)
const express = require('express');
const cors = require('cors');

// Importar o pool de conexão (para garantir que a inicialização do DB ocorra)
require('./config/db'); 

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const { registerAdmin } = require('./controllers/AuthController');
const userRoutes = require('./routes/userRoutes'); // Importa userRoutes
const departamentoRoutes = require('./routes/departamentos'); // Importa as novas rotas
const membroRoutes = require('./routes/membros'); // <-- Importa as rotas de membros
const celulaRoutes = require('./routes/celulas'); // <-- Importa as rotas de células
const summaryRoutes = require('./routes/summary'); // <-- Adiciona importação das rotas de resumo

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuração do CORS CORRIGIDA ---
// Comentar toda a lógica complexa de CORS temporariamente para teste
/*
// Lista de origens permitidas. Lê a URL de produção do .env
const frontendVpsDevOrigin = 'http://189.126.105.138:3000'; 

const allowedOrigins = [
  process.env.FRONTEND_URL_DEV || 'http://localhost:3000',
  process.env.FRONTEND_URL_PROD,
  frontendVpsDevOrigin 
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem 'origin' (ex: Postman, mobile apps) OU se a origem está na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS bloqueado para origem: ${origin}`); // Log útil para debug
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // Para navegadores legados
};

console.log("Origens CORS permitidas (config complexa):", allowedOrigins);

app.use(cors(corsOptions));
*/

// USAR CONFIGURAÇÃO CORS BÁSICA E PERMISSIVA (TEMPORÁRIO PARA TESTE)
app.use(cors());
console.log('>>> ALERTA DEBUG: Usando configuração CORS básica e permissiva! (app.use(cors()))');

// --- Fim da Configuração do CORS CORRIGIDA ---

// Middleware para parsear JSON
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor Backend está rodando!');
});

// Rotas da API
app.use('/api/auth', authRoutes); // Mantém para /login

// ADICIONAR: Definir rota de admin register diretamente no app
// REVERTER: Usar a função registerAdmin importada
app.post('/api/auth/admin-register', registerAdmin); 

app.use('/api/users', userRoutes); // Monta as rotas de usuário sob /api/users
app.use('/api/departamentos', departamentoRoutes); // Monta as rotas de departamento sob /api/departamentos
app.use('/api/membros', membroRoutes); // <-- Monta as rotas de membros
app.use('/api/celulas', celulaRoutes); // <-- Monta as rotas de células
app.use('/api/summary', summaryRoutes); // <-- Monta as rotas de resumo (ex: /api/summary)

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
}); 