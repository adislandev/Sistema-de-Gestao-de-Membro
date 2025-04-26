import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
import { IMaskInput } from 'react-imask';
import { BsPerson, BsPhone, BsCalendarDate, BsListCheck, BsDiagram3 } from 'react-icons/bs';

// onSubmit: função a ser chamada com os dados do formulário
// isLoading: para desabilitar botão de submit
// initialData: dados do membro para edição (null para criação)
// onSelectDepartmentsClick: função para chamar ao clicar no botão "Selecionar Departamentos..."
// onSelectCellClick: função para chamar ao clicar no botão "Selecionar Célula..."
function MemberForm({ onSubmit, isLoading, initialData = null, onSelectDepartmentsClick, onSelectCellClick, cells = [] }) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState(''); // Formato YYYY-MM-DD
  const [telefone, setTelefone] = useState('');
  const [selectedCellId, setSelectedCellId] = useState(''); // Estado para célula

  const isEditing = !!initialData; // Determina se está editando

  // Efeito para preencher o formulário no modo de edição
  useEffect(() => {
    if (isEditing) {
      setNomeCompleto(initialData.nome_completo || '');
      // Formata a data para YYYY-MM-DD se existir
      setDataNascimento(initialData.data_nascimento ? initialData.data_nascimento.split('T')[0] : '');
      setTelefone(initialData.telefone || '');
      setSelectedCellId(initialData.celula_id === null || initialData.celula_id === undefined ? '' : initialData.celula_id); // Preenche célula
    } else {
      // Garante que o formulário esteja limpo ao criar (ou se initialData mudar para null)
      clearForm();
    }
  }, [initialData, isEditing]); // Roda quando initialData ou isEditing mudam

  // Limpa o formulário (pode ser chamado após submit bem-sucedido)
  const clearForm = () => {
    setNomeCompleto('');
    setDataNascimento('');
    setTelefone('');
    setSelectedCellId('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Validação básica no cliente (opcional, backend já valida)
    if (!nomeCompleto.trim()) {
        alert('Nome completo é obrigatório.'); // Simples alert, poderia usar estado de erro
        return;
    }

    const formData = {
      nome_completo: nomeCompleto.trim(),
      telefone: telefone || null, // Com react-imask, o estado 'telefone' já deve ter o valor mascarado
      data_nascimento: dataNascimento || null,
      celula_id: selectedCellId === '' ? null : parseInt(selectedCellId, 10)
    };

    // Não chama clearForm aqui, a página pai decidirá se limpa (só na criação)
    onSubmit(formData, clearForm); // <-- Volta a passar clearForm
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Form.Group as={Col} md={12} controlId="member-name">
          <Form.Label>Nome Completo</Form.Label>
          <InputGroup>
            <InputGroup.Text className="bg-primary text-white"><BsPerson /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Digite o nome completo"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              maxLength={30}
              required
            />
          </InputGroup>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md={12} controlId="formTelefone">
          <Form.Label>Telefone</Form.Label>
          <InputGroup>
            <InputGroup.Text className="bg-primary text-white"><BsPhone /></InputGroup.Text>
            <Form.Control
              as={IMaskInput} 
              mask="(00) 00000-0000"
              value={telefone}
              unmask={false}
              onAccept={(value, mask) => setTelefone(value)}
              placeholder="(99) 99999-9999"
              className="form-control"
            />
          </InputGroup>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md={12} controlId="member-birthdate">
          <Form.Label>Data de Nascimento</Form.Label>
          <InputGroup>
            <InputGroup.Text className="bg-primary text-white"><BsCalendarDate /></InputGroup.Text>
            <Form.Control
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </InputGroup>
        </Form.Group>
      </Row>

      <Row className="mb-3">
          <Col md={12}>
              <Form.Label>Departamentos</Form.Label>
              <div>
                  <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={onSelectDepartmentsClick}
                      disabled={isLoading} 
                      className="d-inline-flex align-items-center"
                  >
                      <BsListCheck className="me-2"/> 
                      {isEditing ? 'Alterar Departamentos...' : 'Selecionar Departamentos...'}
                  </Button>
              </div>
          </Col>
      </Row>

      <Row className="mb-4">
          <Col md={12}>
              <Form.Label>Célula (Opcional)</Form.Label>
              <div>
                  <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={onSelectCellClick}
                      disabled={isLoading}
                      className="d-inline-flex align-items-center me-2"
                  >
                      <BsDiagram3 className="me-2"/> 
                      {isEditing ? 'Alterar Célula...' : 'Selecionar Célula...'}
                  </Button>
                  {selectedCellId && (
                      <span className="text-muted">
                          Selecionada: {cells.find(c => c.id === parseInt(selectedCellId, 10))?.nome || 'ID: ' + selectedCellId}
                      </span>
                  )}
                  {isEditing && selectedCellId && (
                      <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setSelectedCellId('')}
                          disabled={isLoading}
                          className="d-inline-flex align-items-center ms-2"
                          title="Remover associação da célula"
                      >
                         <i className="bi bi-x-lg"></i> 
                      </Button>
                   )}
              </div>
          </Col>
      </Row>

      <div className="mt-4 d-flex justify-content-end">
        <Button type="submit" variant="primary" disabled={isLoading} style={{ minWidth: '120px' }}>
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              <span>{isEditing ? 'Atualizando...' : 'Cadastrando...'}</span>
            </>
          ) : (
            isEditing ? 'Atualizar Membro' : 'Cadastrar Membro' 
          )}
        </Button>
      </div>
    </Form>
  );
}

export default MemberForm; 