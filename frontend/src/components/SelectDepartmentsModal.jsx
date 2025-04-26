import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Spinner, Alert, ListGroup } from 'react-bootstrap';

// Importar API para buscar departamentos
import { getAllDepartments } from '../services/api';

function SelectDepartmentsModal({ show, onHide, onSubmit, initialSelectedIds = [], isLoading: isSubmittingParent }) {
  const [departments, setDepartments] = useState([]);
  const [departmentChecks, setDepartmentChecks] = useState({}); // { [deptId]: true/false }
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  // Busca departamentos ao abrir o modal
  const fetchDepartments = useCallback(async () => {
    if (!show) return; // Não busca se não estiver visível
    setIsFetching(true);
    setError(null);
    try {
      const data = await getAllDepartments();
      setDepartments(data || []);
      // Inicializa checks com base nos IDs passados inicialmente
      const initialChecks = (data || []).reduce((acc, dept) => {
          acc[dept.id] = initialSelectedIds.includes(dept.id);
          return acc;
      }, {});
      setDepartmentChecks(initialChecks);
    } catch (err) {
        console.error("Erro ao buscar departamentos:", err);
        setError('Falha ao carregar lista de departamentos.');
        setDepartments([]);
        setDepartmentChecks({});
    } finally {
        setIsFetching(false);
    }
  }, [show, initialSelectedIds]); // Depende de show e initialSelectedIds

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Handler para mudança nos checkboxes
  const handleCheckChange = (deptId) => {
    setDepartmentChecks(prevChecks => ({
      ...prevChecks,
      [deptId]: !prevChecks[deptId]
    }));
  };

  // Handler para confirmar seleção
  const handleConfirmSelection = () => {
    const selectedIds = Object.entries(departmentChecks)
      .filter(([_, isChecked]) => isChecked)
      .map(([deptId, _]) => parseInt(deptId, 10));
    onSubmit(selectedIds); // Retorna os IDs para a página pai
    onHide(); // Fecha o modal
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Selecionar Departamentos</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        {isFetching && (
          <div className="text-center p-3">
            <Spinner animation="border" size="sm" role="status" />
            <span className="ms-2">Carregando departamentos...</span>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {!isFetching && !error && departments.length > 0 && (
          <ListGroup variant="flush">
            {departments.map((dept) => (
              <ListGroup.Item key={dept.id} className="d-flex justify-content-between align-items-center">
                <span>{dept.nome}</span>
                <Form.Check 
                  type="checkbox"
                  id={`dept-check-${dept.id}`}
                  checked={!!departmentChecks[dept.id]}
                  onChange={() => handleCheckChange(dept.id)}
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
         {!isFetching && !error && departments.length === 0 && (
             <Alert variant="info">Nenhum departamento cadastrado.</Alert>
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

export default SelectDepartmentsModal; 