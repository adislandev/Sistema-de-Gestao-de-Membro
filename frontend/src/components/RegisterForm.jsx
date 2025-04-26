import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';

function RegisterForm({ onSubmit, isLoading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setValidationError(''); // Limpa erro de validação anterior

    if (!username || !password || !confirmPassword) {
      setValidationError('Todos os campos são obrigatórios.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('As senhas não coincidem.');
      return;
    }

    // Chama a função onSubmit passada como prop
    onSubmit({ username, password });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {validationError && <Alert variant="danger">{validationError}</Alert>}
      {error && <Alert variant="danger">Erro no registro: {error.message || 'Tente novamente.'}</Alert>} 
      {/* Mostra erro vindo da API */}

      <Form.Group className="mb-3" controlId="registerUsername">
        <Form.Label>Nome de Usuário</Form.Label>
        <Form.Control
          type="text"
          placeholder="Escolha um nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="registerPassword">
        <Form.Label>Senha</Form.Label>
        <Form.Control
          type="password"
          placeholder="Crie uma senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="registerConfirmPassword">
        <Form.Label>Confirmar Senha</Form.Label>
        <Form.Control
          type="password"
          placeholder="Digite a senha novamente"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </Form.Group>

      <Button variant="primary" type="submit" disabled={isLoading}>
        {isLoading ? (
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
          />
        ) : (
          'Registrar'
        )}
      </Button>
    </Form>
  );
}

export default RegisterForm; 