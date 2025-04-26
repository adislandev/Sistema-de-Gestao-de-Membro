import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, ListGroup } from 'react-bootstrap';

// Recebe: show, onHide, onSubmit, cells (lista de células), initialSelectedId, isLoadingParent
function SelectCelulaModal({ show, onHide, onSubmit, cells = [], initialSelectedId = null, isLoadingParent }) {
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null); // Erro interno do modal (ex: lista vazia)

  // Define a célula selecionada inicialmente ou limpa quando o modal abre/initialId muda
  useEffect(() => {
    if (show) {
      setSelectedId(initialSelectedId === null || initialSelectedId === undefined ? null : initialSelectedId);
      if (cells.length === 0) {
          setError('Nenhuma célula cadastrada para selecionar.');
      } else {
          setError(null);
      }
    } else {
      // Limpa seleção e erro ao fechar
      setSelectedId(null);
      setError(null);
    }
  }, [show, initialSelectedId, cells]);

  // Handler para mudança na seleção (radio)
  const handleRadioChange = (event) => {
    setSelectedId(parseInt(event.target.value, 10));
    setError(null); // Limpa erro ao selecionar
  };

  // Handler para confirmar seleção
  const handleConfirmSelection = () => {
    // Verifica se algo foi selecionado (embora o botão fique desabilitado)
    if (selectedId === null && cells.length > 0) {
      setError('Por favor, selecione uma célula.');
      return;
    }
    onSubmit(selectedId); // Retorna o ID (pode ser null se nenhuma for selecionada ou se limparmos)
    onHide(); // Fecha o modal
  };

  // Handler para limpar seleção
  const handleClearSelection = () => {
    setSelectedId(null);
    // Poderia chamar onSubmit(null) e onHide() aqui direto se desejado
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Selecionar Célula</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        {/* Não precisamos de Spinner aqui, pois cells é passado por props */}
        {error && <Alert variant="warning">{error}</Alert>}
        {!error && cells.length > 0 && (
          <ListGroup variant="flush">
            {cells.map((cell) => (
              <ListGroup.Item key={cell.id} action onClick={() => setSelectedId(cell.id)} active={selectedId === cell.id} className="d-flex justify-content-between align-items-center">
                 <span>{cell.nome}</span>
                <Form.Check 
                  type="radio"
                  name="celulaSelection"
                  id={`cell-radio-${cell.id}`}
                  value={cell.id}
                  checked={selectedId === cell.id}
                  onChange={handleRadioChange} // Embora o clique no item já selecione
                  className="ms-auto" // Alinha à direita
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClearSelection} disabled={isLoadingParent || selectedId === null}>
          Limpar Seleção
        </Button>
        <Button variant="secondary" onClick={onHide} disabled={isLoadingParent}>
          Cancelar
        </Button>
        <Button 
            variant="primary" 
            onClick={handleConfirmSelection} 
            disabled={isLoadingParent || selectedId === null || error}
        >
          Confirmar Seleção
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SelectCelulaModal; 