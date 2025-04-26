import React, { useState /*, useContext */ } from 'react'; // Remove useContext se não usado diretamente
import { useNavigate, Link } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext'; // <-- REMOVER Importação direta
import { useAuth } from '../context/AuthContext'; // <-- USAR O HOOK useAuth
import { Container, Form, Button, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';
import LoginForm from '../components/LoginForm';
import { loginUser } from '../services/api'; // Descomentado
import { toast } from 'react-toastify'; // Importa toast
// Importa o CSS Module
import styles from './LoginPage.module.css'; 
// ADICIONAR: Importar ícone da cruz de react-icons
import { FaCross } from "react-icons/fa"; 

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();

  const handleLoginSubmit = async (credentials) => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Chama a API de login
      const response = await loginUser(credentials);
      console.log('[LoginPage] API Login Response:', response); // Log de depuração
      
      // 2. Extrai o token da resposta
      const token = response.token;
      if (!token) {
        throw new Error("Token não recebido do servidor.");
      }

      // 3. Chama a função login do AuthContext com o TOKEN
      await contextLogin(token);
      
      toast.success(response.message || 'Login realizado com sucesso!');
      navigate('/dashboard'); // Redireciona para o dashboard após login

    } catch (err) {
      console.error("Erro no login (LoginPage):", err);
      const message = err.response?.data?.message || err.message || 'Falha no login. Verifique suas credenciais.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Aplica a classe do container principal
    <div className={styles.loginContainer}>
      {/* Aplica a classe do card centralizado */}
      <div className={styles.loginCard}>
        
        {/* Ícone da Cruz */}
        <div className={styles.loginIcon}>
          {/* Usa o ícone FaCross importado */}
          <FaCross /> 
        </div>
        
        {/* Título (opcional, pode estar dentro do LoginForm) */}
        {/* <h2>Login</h2> */}
        
        <LoginForm 
          onSubmit={handleLoginSubmit} 
          isLoading={isLoading} 
          error={error} // Passa o erro para o LoginForm exibir se necessário
        />

      </div>
    </div>
  );
}

export default LoginPage; 