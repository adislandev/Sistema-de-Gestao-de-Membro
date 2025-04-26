import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Table, Button, Form, Spinner, Alert } from 'react-bootstrap';

// Importa API real
import { getDepartmentMembers } from '../services/api'; 

// Remove Placeholder para API
/*
const getDepartmentMembersPlaceholder = async (departmentId) => { ... };
*/

function ManageDepartmentMembersModal({ show, onHide, department, isLoading, onSubmit }) {
  const [membersData, setMembersData] = useState([]);
  const [memberChecks, setMemberChecks] = useState({}); // { [memberId]: true/false }
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [error, setError] = useState(null);

  const departmentId = department?.id;
  const departmentName = department?.nome || '';

  // Busca dados dos membros quando o modal abre ou o departamento muda
  const fetchMemberData = useCallback(async () => {
    if (!departmentId) {
        setMembersData([]);
        setMemberChecks({});
        return;
    }
    setIsFetchingMembers(true);
    setError(null);
    try {
        const data = await getDepartmentMembers(departmentId); // <-- Usa API Real
        // const data = await getDepartmentMembersPlaceholder(departmentId); // Remove Placeholder
        setMembersData(data || []);
        // Inicializa o estado dos checkboxes com base nos dados recebidos
        const initialChecks = (data || []).reduce((acc, member) => {
            acc[member.id] = member.pertence_ao_departamento;
            return acc;
        }, {});
        setMemberChecks(initialChecks);
    } catch (err) {
        console.error(`Erro ao buscar membros para o departamento ${departmentId}:`, err);
        setError('Falha ao carregar lista de membros.');
        setMembersData([]);
        setMemberChecks({});
    } finally {
        setIsFetchingMembers(false);
    }
  }, [departmentId]);

  useEffect(() => {
    if (show) {
      fetchMemberData();
    }
    // Reset states when modal closes
    if (!show) {
         setMembersData([]);
         setMemberChecks({});
         setError(null);
    }
  }, [show, fetchMemberData]);

  // Handler para mudança nos checkboxes
  const handleCheckChange = (memberId) => {
    setMemberChecks(prevChecks => ({
      ...prevChecks,
      [memberId]: !prevChecks[memberId] // Inverte o estado
    }));
  };

  // Handler para salvar
  const handleSaveChanges = () => {
    // Filtra apenas os IDs dos membros que estão marcados
    const selectedMemberIds = Object.entries(memberChecks)
      .filter(([_, isChecked]) => isChecked)
      .map(([memberId, _]) => parseInt(memberId, 10)); // Converte IDs para número
      
    onSubmit(selectedMemberIds); // Chama a função passada pela página pai
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Membros do Departamento: {departmentName}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {isFetchingMembers && (
          <div className="text-center p-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Carregando membros...</span>
            </Spinner>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {!isFetchingMembers && !error && membersData.length > 0 && (
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th className="text-center">Pertence</th>
              </tr>
            </thead>
            <tbody>
              {membersData.map((member) => (
                <tr key={member.id}>
                  <td>{member.nome_completo}</td>
                  <td>{member.telefone || '-'}</td>
                  <td className="text-center">
                    <Form.Check 
                      type="checkbox"
                      id={`member-check-${member.id}`}
                      checked={!!memberChecks[member.id]} // Usa !! para garantir booleano
                      onChange={() => handleCheckChange(member.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {!isFetchingMembers && !error && membersData.length === 0 && (
             <Alert variant="info">Nenhum membro cadastrado no sistema.</Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Fechar
        </Button>
        <Button variant="primary" onClick={handleSaveChanges} disabled={isLoading || isFetchingMembers}>
          {isLoading ? (
            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1"/> Salvando...</>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ManageDepartmentMembersModal; 