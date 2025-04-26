import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import RegisterForm from '../components/RegisterForm';
import { registerUser } from '../services/api'; // Importa a função da API

function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegisterSubmit = async (userData) => {
    setIsLoading(true);
    setError(null); // Limpa erro anterior
    try {
      const response = await registerUser(userData);
      toast.success(response.message || 'Usuário registrado com sucesso! Faça o login.');
      navigate('/login'); // Redireciona para a página de login após sucesso
    } catch (err) {
      console.error("RegisterPage Error:", err); 
      const errorMessage = err?.message || 'Falha ao registrar. Verifique os dados ou tente novamente.';
      setError({ message: errorMessage }); // Define o erro para o RegisterForm exibir
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title className="text-center mb-4">Criar Nova Conta</Card.Title>
              <RegisterForm 
                onSubmit={handleRegisterSubmit} 
                isLoading={isLoading}
                error={error}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RegisterPage; 