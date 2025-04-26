import axios from 'axios';

// Lê a URL base da API da variável de ambiente VITE_API_BASE_URL
// Fornece um fallback para localhost:3001/api para desenvolvimento
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

console.log("API Base URL:", apiBaseUrl); // Log para depuração

// Cria uma instância do axios com configurações padrão
const apiClient = axios.create({
  baseURL: apiBaseUrl, 
  headers: {
    'Content-Type': 'application/json',
  }
});

/* 
Interceptador de Resposta (Opcional, mas útil para tratamento centralizado de erros)

apiClient.interceptors.response.use(
  (response) => {
    // Qualquer código de status que esteja dentro do intervalo de 2xx faz com que esta função seja acionada
    return response;
  },
  (error) => {
    // Qualquer código de status que caia fora do intervalo de 2xx faz com que esta função seja acionada
    console.error('Erro na resposta da API:', error.response || error.message || error);
    
    // Você pode adicionar lógica de erro global aqui, como redirecionar para login em caso de 401 não autorizado
    // if (error.response && error.response.status === 401) {
    //   // Limpar token, redirecionar para login, etc.
    //   localStorage.removeItem('authToken');
    //   window.location.href = '/login'; // Redirecionamento simples
    // }

    // Rejeita a promise para que o erro possa ser tratado no local da chamada (no componente/página)
    return Promise.reject(error);
  }
);
*/

/**
 * Registra um novo usuário.
 * @param {object} userData - Objeto { username, password }.
 * @returns {Promise<object>} - Resposta da API (ex: { message, userId }).
 */
export const registerUser = async (userData) => {
  try {
    // Não precisa de token para registrar
    const response = await apiClient.post('/auth/register', userData);
    return response.data; // Retorna { message, userId }
  } catch (error) {
    console.error("Erro ao registrar usuário:", error.response || error);
    // Lança o erro para ser tratado no componente que chamou
    throw error.response?.data || error; 
  }
};

/**
 * Autentica um usuário (login).
 * @param {object} userData - Credenciais do usuário { username, password }.
 * @returns {Promise<object>} - A resposta da API (espera-se que contenha o token).
 */
export const loginUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/login', userData);
    return response.data; // Retorna apenas os dados da resposta (ex: { message: '...', token: '...' })
  } catch (error) {
    throw error;
  }
};

/**
 * Registra um novo administrador (rota temporária).
 * @param {object} adminData - Objeto { name, email, password }.
 * @returns {Promise<object>} - Resposta da API (ex: { message, userId }).
 */
export const registerAdminUser = async (adminData) => {
  try {
    // Rota pública, não precisa de token
    const response = await apiClient.post('/auth/admin-register', adminData);
    return response.data; // Retorna { message, userId }
  } catch (error) {
    console.error("Erro ao registrar administrador:", error.response || error);
    // Lança o erro para ser tratado no componente
    throw error.response?.data || error; 
  }
};

/**
 * Busca os dados do perfil do usuário logado.
 * Requer que o token JWT seja enviado no cabeçalho Authorization.
 * @returns {Promise<object>} - Os dados do perfil do usuário (ex: id, username, created_at).
 */
export const getUserProfile = async () => {
  // Pega o token do localStorage (AuthContext também o armazena, mas ler aqui é direto)
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado.'));
  }

  try {
    // Faz a requisição GET enviando o token no cabeçalho Authorization
    const response = await apiClient.get('/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    // Se o token for inválido/expirado, o backend retornará 401/403,
    // e o erro será capturado aqui ou pelo interceptor.
    console.error("Erro ao buscar perfil:", error.response || error);
    throw error;
  }
};

/**
 * Altera a senha do usuário logado.
 * Requer token JWT no cabeçalho Authorization.
 * @param {object} passwordData - Objeto contendo { currentPassword, newPassword }.
 * @returns {Promise<object>} - A resposta da API (ex: { message: '...' }).
 */
export const changePassword = async (passwordData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para alterar senha.'));
  }

  try {
    // Faz a requisição PUT enviando token e os dados da senha
    const response = await apiClient.put('/users/change-password', passwordData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao alterar senha:", error.response || error);
    throw error;
  }
};

/**
 * Lista todos os usuários (requer privilégio de admin).
 * Requer token JWT no cabeçalho Authorization.
 * @returns {Promise<Array>} - Um array com os objetos dos usuários.
 */
export const getAllUsers = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado.'));
  }

  try {
    const response = await apiClient.get('/users', { // Chama GET /api/users
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data; // Retorna o array de usuários
  } catch (error) {
    // Erros 401/403 (não autenticado/não admin) serão capturados aqui
    console.error("Erro ao listar usuários:", error.response || error);
    throw error;
  }
};

/**
 * Exclui um usuário específico (requer privilégio de admin).
 * Requer token JWT no cabeçalho Authorization.
 * @param {number} userId - O ID do usuário a ser excluído.
 * @returns {Promise<void>} - Retorna uma promessa vazia em caso de sucesso (204 No Content).
 */
export const deleteUser = async (userId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado.'));
  }

  try {
    // Faz a requisição DELETE para /api/users/:id
    await apiClient.delete(`/users/${userId}`, { // Usa template literal para incluir o ID na URL
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    // DELETE bem-sucedido geralmente não retorna corpo (204)
  } catch (error) {
    console.error(`Erro ao excluir usuário ${userId}:`, error.response || error);
    throw error;
  }
};

/**
 * Cria um novo usuário (apenas Admin).
 * Requer token JWT no cabeçalho Authorization.
 * @param {object} userData - Objeto { username, password, role }.
 * @returns {Promise<object>} - Os dados do usuário criado (sem senha).
 */
export const createUserByAdmin = async (userData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado.'));
  }
  try {
    const response = await apiClient.post('/users', userData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data; // Retorna o usuário criado (id, username, role)
  } catch (error) {
    console.error("Erro ao criar usuário (admin):", error.response || error);
    throw error;
  }
};

/**
 * Atualiza um usuário existente (apenas Admin).
 * Requer token JWT no cabeçalho Authorization.
 * @param {number} userId - O ID do usuário a ser atualizado.
 * @param {object} userData - Objeto { username, role }.
 * @returns {Promise<object>} - A mensagem de sucesso da API.
 */
export const updateUserByAdmin = async (userId, userData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado.'));
  }
  try {
    const response = await apiClient.put(`/users/${userId}`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data; // Retorna { message: '...' }
  } catch (error) {
    console.error(`Erro ao atualizar usuário ${userId} (admin):`, error.response || error);
    throw error;
  }
};

// --- CRUD Departamentos --- //

/**
 * Lista todos os departamentos.
 * Requer token JWT no cabeçalho Authorization.
 * @returns {Promise<Array>} - Um array com os objetos dos departamentos.
 */
export const getAllDepartments = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para listar departamentos.'));
  }
  try {
    const response = await apiClient.get('/departamentos', { // Chama GET /api/departamentos
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna o array de departamentos
  } catch (error) {
    console.error("Erro ao listar departamentos:", error.response || error);
    throw error;
  }
};

/**
 * Cria um novo departamento.
 * Requer token JWT no cabeçalho Authorization.
 * @param {object} departmentData - Objeto { nome }.
 * @returns {Promise<object>} - O departamento criado (com id).
 */
export const createDepartment = async (departmentData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para criar departamento.'));
  }
  try {
    const response = await apiClient.post('/departamentos', departmentData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna o departamento criado { id, nome, message }
  } catch (error) {
    console.error("Erro ao criar departamento:", error.response || error);
    throw error;
  }
};

/**
 * Atualiza um departamento existente.
 * Requer token JWT no cabeçalho Authorization.
 * @param {number} departmentId - O ID do departamento a ser atualizado.
 * @param {object} departmentData - Objeto { nome }.
 * @returns {Promise<object>} - A mensagem de sucesso da API.
 */
export const updateDepartment = async (departmentId, departmentData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para atualizar departamento.'));
  }
  try {
    const response = await apiClient.put(`/departamentos/${departmentId}`, departmentData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { id, nome, message }
  } catch (error) {
    console.error(`Erro ao atualizar departamento ${departmentId}:`, error.response || error);
    throw error;
  }
};

/**
 * Exclui um departamento específico.
 * Requer token JWT no cabeçalho Authorization.
 * @param {number} departmentId - O ID do departamento a ser excluído.
 * @returns {Promise<object>} - A mensagem de sucesso da API.
 */
export const deleteDepartment = async (departmentId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para excluir departamento.'));
  }
  try {
    // DELETE não costuma enviar corpo, apenas ID na URL
    const response = await apiClient.delete(`/departamentos/${departmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { message: '...' } ou vazio se backend retornar 204
  } catch (error) {
    console.error(`Erro ao excluir departamento ${departmentId}:`, error.response || error);
    throw error;
  }
};

/**
 * Busca todos os membros, indicando quais pertencem a um departamento específico.
 * Requer token JWT.
 * @param {number} departmentId - ID do departamento.
 * @returns {Promise<Array>} - Array de objetos de membro com a flag `pertence_ao_departamento`.
 */
export const getDepartmentMembers = async (departmentId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado.'));
  }
  try {
    const response = await apiClient.get(`/departamentos/${departmentId}/membros`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; 
  } catch (error) {
    console.error(`Erro ao buscar membros do departamento ${departmentId}:`, error.response || error);
    throw error;
  }
};

/**
 * Atualiza (substitui) a lista de membros de um departamento.
 * Requer token JWT.
 * @param {number} departmentId - ID do departamento.
 * @param {Array<number>} memberIds - Array com os IDs dos membros que devem pertencer ao departamento.
 * @returns {Promise<object>} - A mensagem de sucesso da API.
 */
export const updateDepartmentMembers = async (departmentId, payloadData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado.'));
  }
  try {
    // O argumento payloadData já é o objeto { memberIds: [...] } esperado pelo backend
    // const payload = { memberIds: memberIds }; // Linha removida
    const response = await apiClient.put(`/departamentos/${departmentId}/membros`, payloadData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { message: '...' }
  } catch (error) {
    console.error(`Erro ao atualizar membros do departamento ${departmentId}:`, error.response || error);
    throw error;
  }
};

// --- CRUD Membros --- //

/**
 * Cadastra um novo membro.
 * Requer token JWT no cabeçalho Authorization.
 * @param {object} memberData - Objeto { nome_completo, data_nascimento, telefone }.
 * @returns {Promise<object>} - O membro criado (com id) e mensagem.
 */
export const createMember = async (memberData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para cadastrar membro.'));
  }
  try {
    const response = await apiClient.post('/membros', memberData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { id, nome_completo, ..., message }
  } catch (error) {
    console.error("Erro ao cadastrar membro:", error.response || error);
    throw error;
  }
};

/**
 * Busca membros com filtros e paginação.
 * Requer token JWT.
 * @param {object} params - Objeto com parâmetros de query (nome, departamentoId, celulaId, page, limit).
 * @returns {Promise<object>} - Objeto com { membros, totalItems, totalPages, currentPage }.
 */
export const getMembers = async (params = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para listar membros.'));
  }
  try {
    // Usa apiClient.get com o segundo argumento `config` para passar `params` e `headers`
    const response = await apiClient.get('/membros', {
      params: params, // axios serializa isso como query string: ?nome=...&page=...
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar membros:", error.response || error);
    throw error;
  }
};

/**
 * Atualiza um membro existente.
 * Requer token JWT.
 * @param {number} memberId - O ID do membro a ser atualizado.
 * @param {object} memberData - Objeto com os dados a serem atualizados.
 * @returns {Promise<object>} - A mensagem de sucesso da API.
 */
export const updateMember = async (memberId, memberData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para atualizar membro.'));
  }
  try {
    const response = await apiClient.put(`/membros/${memberId}`, memberData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { message: '...' }
  } catch (error) {
    console.error(`Erro ao atualizar membro ${memberId}:`, error.response || error);
    throw error;
  }
};

/**
 * Exclui um membro específico.
 * Requer token JWT.
 * @param {number} memberId - O ID do membro a ser excluído.
 * @returns {Promise<object>} - A mensagem de sucesso da API.
 */
export const deleteMember = async (memberId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para excluir membro.'));
  }
  try {
    const response = await apiClient.delete(`/membros/${memberId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { message: '...' } ou vazio
  } catch (error) {
    console.error(`Erro ao excluir membro ${memberId}:`, error.response || error);
    throw error;
  }
};

// --- CRUD Células (apenas GET por enquanto) --- //

/**
 * Lista todas as células.
 * Requer token JWT.
 * @returns {Promise<Array>} - Um array com os objetos das células.
 */
export const getAllCells = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para listar células.'));
  }
  try {
    const response = await apiClient.get('/celulas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna o array de células
  } catch (error) {
    console.error("Erro ao listar células:", error.response || error);
    throw error;
  }
};

/**
 * Cria uma nova célula.
 * Requer token JWT.
 * @param {object} cellData - Objeto { nome, lider_id, bairro?, rua? }.
 * @returns {Promise<object>} - A célula criada (com id).
 */
export const createCell = async (cellData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para criar célula.'));
  }
  try {
    const response = await apiClient.post('/celulas', cellData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { id, nome, ..., message }
  } catch (error) {
    console.error("Erro ao criar célula:", error.response || error);
    throw error;
  }
};

/**
 * Atualiza uma célula existente.
 * Requer token JWT.
 * @param {number} cellId - O ID da célula a ser atualizada.
 * @param {object} cellData - Objeto com os dados a serem atualizados.
 * @returns {Promise<object>} - A mensagem de sucesso da API.
 */
export const updateCell = async (cellId, cellData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para atualizar célula.'));
  }
  try {
    const response = await apiClient.put(`/celulas/${cellId}`, cellData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { message: '...' }
  } catch (error) {
    console.error(`Erro ao atualizar célula ${cellId}:`, error.response || error);
    throw error;
  }
};

/**
 * Exclui uma célula específica.
 * Requer token JWT.
 * @param {number} cellId - O ID da célula a ser excluída.
 * @returns {Promise<object>} - A mensagem de sucesso da API.
 */
export const deleteCell = async (cellId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para excluir célula.'));
  }
  try {
    const response = await apiClient.delete(`/celulas/${cellId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { message: '...' } ou vazio
  } catch (error) {
    console.error(`Erro ao excluir célula ${cellId}:`, error.response || error);
    throw error;
  }
};

// --- Dashboard Summary --- //

/**
 * Busca os dados de resumo para o Dashboard.
 * Requer token JWT no cabeçalho Authorization.
 * @returns {Promise<object>} - Objeto com os totais { totalMembros, totalDepartamentos, totalCelulas, totalUsuarios }.
 */
export const getSummaryData = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error('Nenhum token encontrado para buscar resumo.'));
  }
  try {
    const response = await apiClient.get('/summary', { // Chama GET /api/summary
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data; // Retorna { totalMembros, ... }
  } catch (error) {
    console.error("Erro ao buscar dados de resumo:", error.response || error);
    // Lança o erro para que a página possa tratá-lo (ex: exibir mensagem)
    throw error; 
  }
};

// Você pode adicionar outras chamadas de API aqui conforme necessário

export default apiClient; // Exporta a instância configurada 