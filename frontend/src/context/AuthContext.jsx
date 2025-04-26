import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserProfile } from '../services/api'; // Importa a função de busca de perfil

// 1. Criar o Contexto
const AuthContext = createContext(null);

// 2. Criar o Provedor (Provider Component)
export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [user, setUser] = useState(null); // Novo estado para dados do usuário
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Começa como false
  const [isLoading, setIsLoading] = useState(true); // Verificação inicial

  // Função para buscar dados do usuário e atualizar o estado
  const fetchAndSetUser = async () => {
    try {
      console.log("[AuthContext] Buscando perfil do usuário...");
      const userData = await getUserProfile(); // Chama a API
      console.log("[AuthContext] Perfil recebido:", userData);
      setUser(userData); // Armazena os dados do usuário
      setIsAuthenticated(true); // Confirma autenticação
    } catch (error) {
      console.error("[AuthContext] Erro ao buscar perfil ou token inválido:", error);
      // Se falhar (token inválido/expirado), limpa tudo
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Efeito para verificar o token inicial e buscar usuário
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token); // Define o token imediatamente
      fetchAndSetUser(); // Tenta buscar o usuário com o token
    } else {
      // Se não há token, não está autenticado e não precisa buscar
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false); // Terminou a verificação inicial (mesmo que a busca ainda esteja ocorrendo)
  }, []); // Roda apenas na montagem

  // Função para fazer login
  const login = async (token) => { // Torna async para esperar fetchAndSetUser
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    // Após definir o token, busca os dados do usuário associados a ele
    await fetchAndSetUser(); 
  };

  // Função para fazer logout
  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null); // Limpa dados do usuário
    setIsAuthenticated(false);
  };

  // Valor que será compartilhado pelo contexto
  const value = {
    authToken,
    user, // Expõe os dados do usuário
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children} 
    </AuthContext.Provider>
  );
};

// 3. Criar um Hook customizado para consumir o contexto (opcional, mas recomendado)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  // Se o contexto for null (valor inicial antes do provider montar), pode indicar um problema
  // ou que ainda está carregando. Uma verificação explícita pode ser útil dependendo do caso.
  if (context === null && !isLoading) {
     // Ou retornar um estado padrão, ou lançar erro, ou esperar o isLoading ser falso
     console.warn('AuthContext ainda não está disponível ou está carregando.');
  }
  return context;
}; 