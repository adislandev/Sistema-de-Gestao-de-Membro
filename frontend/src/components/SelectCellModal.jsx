import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Spinner, Alert, ListGroup } from 'react-bootstrap';

// Importar API para buscar células
import { getAllCells } from '../services/api';

function SelectCellModal({ show, onHide, onSubmit, initialSelectedId = null, isLoading: isSubmittingParent }) {
  const [cells, setCells] = useState([]);
  // Guarda o ID da célula selecionada no estado local do modal
  const [selectedCellId, setSelectedCellId] = useState(initialSelectedId);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  // Busca células ao abrir o modal
  const fetchCellsCallback = useCallback(async () => {
    if (!show) return;
    setIsFetching(true);
    setError(null);
    try {
      const data = await getAllCells();
      setCells(data || []);
      // Sincroniza o estado local com o inicial sempre que abrir/mudar initial
      setSelectedCellId(initialSelectedId);
    } catch (err) {
      console.error("Erro ao buscar células:", err);
      setError('Falha ao carregar lista de células.');
      setCells([]);
      setSelectedCellId(null);
    } finally {
      setIsFetching(false);
    }
  }, [show, initialSelectedId]);

  useEffect(() => {
    fetchCellsCallback();
  }, [fetchCellsCallback]);

  // Handler para mudança na seleção do radio button
  const handleSelectionChange = (event) => {
    // event.target.value será o ID da célula como string, ou "none"
    const value = event.target.value;
    setSelectedCellId(value === 'none' ? null : parseInt(value, 10));
  };

  // Handler para confirmar seleção
  const handleConfirmSelection = () => {
    onSubmit(selectedCellId); // Retorna o ID (ou null) para a página pai
    onHide(); // Fecha o modal
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Selecionar Célula</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        {isFetching && (
          <div className="text-center p-3">
            <Spinner animation="border" size="sm" role="status" />
            <span className="ms-2">Carregando células...</span>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        
        {!isFetching && !error && (
            <Form>
                 {/* Opção para Nenhuma Célula */} 
                 <Form.Check 
                    type="radio"
                    id="cell-radio-none"
                    name="cellSelectionGroup"
                    label="(Nenhuma Célula)"
                    value="none"
                    checked={selectedCellId === null}
                    onChange={handleSelectionChange}
                    className="mb-2"
                />
                <hr />
                 {/* Lista de Células */} 
                 {cells.length > 0 ? (
                    cells.map((cell) => (
                        <Form.Check 
                            key={cell.id}
                            type="radio"
                            id={`cell-radio-${cell.id}`}
                            name="cellSelectionGroup" // Garante que só um radio seja selecionado
                            label={cell.nome}
                            value={cell.id} // Valor é o ID da célula
                            checked={selectedCellId === cell.id} // Verifica se este ID está selecionado
                            onChange={handleSelectionChange} // Handler para atualizar o estado
                            className="mb-2"
                        />
                    ))
                 ) : (
                      <Alert variant="info" className="mt-3">Nenhuma célula cadastrada.</Alert>
                 )}
            </Form>
        )}
       
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSubmittingParent}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleConfirmSelection} disabled={isFetching || isSubmittingParent}>
          Confirmar Seleção
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SelectCellModal; 