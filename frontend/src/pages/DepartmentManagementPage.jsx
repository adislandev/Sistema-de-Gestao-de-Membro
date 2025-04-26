import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Alert, Spinner, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import DepartmentForm from '../components/DepartmentForm';
import ManageDepartmentMembersModal from '../components/ManageDepartmentMembersModal';

// Importa funções reais da API
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment, updateDepartmentMembers } from '../services/api';

// Remove Placeholder para API de update de membros
/*
const updateDepartmentMembersPlaceholder = async (deptId, memberIds) => { ... };
*/

function DepartmentManagementPage() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Estado do Modal
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null); // null: criar, obj: editar

  // Novos estados para o modal de gerenciamento de membros
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false); // Loading para salvar membros

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllDepartments(); // <-- Usa a função real
      setDepartments(data);
    } catch (err) {
      console.error("Erro ao buscar departamentos:", err);
      const message = err.message || 'Falha ao carregar departamentos.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // --- Handlers do Modal ---
  const handleShowCreateModal = () => {
    setEditingDepartment(null);
    setShowModal(true);
  };

  const handleShowEditModal = (department) => {
    setEditingDepartment(department);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return; // Não fecha se estiver enviando
    setShowModal(false);
    setEditingDepartment(null);
  };

  // --- Handlers de Ações CRUD ---
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    const action = editingDepartment ? 'atualizar' : 'criar';
    const apiCall = editingDepartment
      ? updateDepartment(editingDepartment.id, formData) // <-- Usa a função real
      : createDepartment(formData); // <-- Usa a função real

    try {
      const result = await apiCall;
      toast.success(result.message || `Departamento ${action === 'criar' ? 'criado' : 'atualizado'} com sucesso!`);
      handleCloseModal();
      fetchDepartments(); // Recarrega a lista
    } catch (err) {
      console.error(`Erro ao ${action} departamento:`, err);
      const message = err.message || `Falha ao ${action} departamento.`;
      toast.error(message);
      // Mantém o modal aberto em caso de erro para correção
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm(`Tem certeza que deseja excluir o departamento ID ${id}?`)) {
      return;
    }
    
    setIsLoading(true); // Pode usar um loading específico para a linha se preferir
    try {
      const result = await deleteDepartment(id); // <-- Usa a função real
      toast.success(result.message || 'Departamento excluído com sucesso!');
      fetchDepartments(); // Recarrega a lista
    } catch (err) {
       console.error(`Erro ao excluir departamento ${id}:`, err);
       const message = err.message || 'Falha ao excluir departamento.';
       toast.error(message);
    } finally {
       setIsLoading(false);
    }
  };

  // --- Handlers do Modal Gerenciar Membros ---
  const handleShowManageMembersModal = (department) => {
      setSelectedDepartment(department);
      setShowManageModal(true);
  };

  const handleCloseManageMembersModal = () => {
      if (isSubmittingModal) return;
      setShowManageModal(false);
      setSelectedDepartment(null);
  };

  const handleUpdateMembers = async (selectedMemberIds) => {
      if (!selectedDepartment) return;
      setIsSubmittingModal(true);
      try {
          // Usa API real, passando objeto { memberIds: ... } como payload
          const result = await updateDepartmentMembers(selectedDepartment.id, { memberIds: selectedMemberIds }); 
          // const result = await updateDepartmentMembersPlaceholder(selectedDepartment.id, selectedMemberIds); // Remove Placeholder
          toast.success(result.message || 'Membros do departamento atualizados!');
          handleCloseManageMembersModal();
          // Não precisa recarregar a lista de departamentos aqui
      } catch (err) {
          console.error(`Erro ao atualizar membros do departamento ${selectedDepartment.id}:`, err);
          const message = err.response?.data?.message || err.message || 'Falha ao atualizar membros do departamento.';
          toast.error(message);
      } finally {
          setIsSubmittingModal(false);
      }
  };

  return (
    <>
      <Card className="mt-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h4 mb-0">Gerenciamento de Departamentos</h1>
            <Button variant="primary" onClick={handleShowCreateModal}>
              <i className="bi bi-plus-lg me-2"></i>Novo Departamento
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
            {/* Estados de Loading e Erro */}
            {isLoading && (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </Spinner>
              </div>
            )}
            {error && <Alert variant="danger">Erro: {error}</Alert>}

            {!isLoading && !error && departments.length === 0 && (
                <Alert variant="info">Nenhum departamento encontrado.</Alert>
            )}

            {/* Tabela */}
            {!isLoading && !error && departments.length > 0 && (
              <Table bordered responsive className="mt-3 mb-0">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th className="text-center">Total de Membros</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.nome}</td>
                      <td className="text-center">{dept.totalMembros}</td>
                      <td className="text-center">
                        {/* Botões */}
                        <Button
                              variant="info"
                              size="sm"
                              className="me-2"
                              onClick={() => handleShowManageMembersModal(dept)}
                              title="Gerenciar Membros"
                          >
                              <i className="bi bi-people-fill"></i>
                          </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowEditModal(dept)}
                          title="Editar Departamento"
                         >
                          <i className="bi bi-pencil-fill"></i>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteDepartment(dept.id)}
                          title="Excluir Departamento"
                        >
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
        </Card.Body>
      </Card>

      {/* --- Modais --- */}
      {/* Modal Criar/Editar Departamento */} 
      <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDepartment ? 'Editar Departamento' : 'Criar Novo Departamento'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DepartmentForm
            initialData={editingDepartment}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
          />
        </Modal.Body>
      </Modal>

      {/* Modal Gerenciar Membros */} 
      {selectedDepartment && (
          <ManageDepartmentMembersModal
              show={showManageModal}
              onHide={handleCloseManageMembersModal}
              department={selectedDepartment}
              isLoading={isSubmittingModal}
              onSubmit={handleUpdateMembers}
          />
      )}
    </> // Fechamento do Fragment <> 
  );
}

export default DepartmentManagementPage; 