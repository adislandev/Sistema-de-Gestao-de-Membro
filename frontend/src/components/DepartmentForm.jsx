import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap'; // Importa componentes do React-Bootstrap

function DepartmentForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(''); // Erro de validação local

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setName(initialData.nome); // Assumindo que o campo no backend é 'nome'
    } else {
      setName(''); // Reset para criação
    }
    setError('');
  }, [initialData, isEditing]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    // Validação
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('O nome do departamento é obrigatório.');
      return;
    }
    if (trimmedName.length > 15) {
      setError('O nome do departamento não pode exceder 15 caracteres.');
      return;
    }

    // Chama a função submit da página pai com o nome
    onSubmit({ nome: trimmedName }); 
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>} 

      <Form.Group className="mb-3" controlId="department-name">
        <Form.Label>Nome do Departamento</Form.Label>
        <Form.Control
          type="text"
          placeholder="Digite o nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={15} // Impede digitação além de 15 (feedback visual)
          required
          autoFocus // Foca neste campo ao abrir o modal
        />
        <Form.Text muted>
          Máximo de 15 caracteres.
        </Form.Text>
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="ms-1">Salvando...</span>
            </>
          ) : (isEditing ? 'Atualizar Departamento' : 'Criar Departamento')}
        </Button>
      </div>
    </Form>
  );
}

export default DepartmentForm; 