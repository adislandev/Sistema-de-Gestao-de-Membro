import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Alert, Spinner, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CellForm from '../components/CellForm'; 

// Importa funções da API
import { getAllCells, createCell, updateCell, deleteCell } from '../services/api'; // Adiciona novas importações

function CellManagementPage() {
  // Estados
  const [cells, setCells] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Modal (usaremos um modal para criar e editar)
  const [showModal, setShowModal] = useState(false);
  const [editingCell, setEditingCell] = useState(null); // null: criar, obj: editar
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca inicial de células
  const fetchCells = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const data = await getAllCells(); // Usa API real para buscar
        setCells(data || []);
    } catch (err) {
        console.error("Erro ao buscar células:", err);
        const message = err.message || 'Falha ao carregar células.';
        setError(message);
        toast.error(message);
        setCells([]);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCells();
  }, [fetchCells]);

  // --- Handlers Modal ---
  const handleShowCreateModal = () => {
    setEditingCell(null);
    setShowModal(true);
  };

  const handleShowEditModal = (cell) => {
    setEditingCell(cell); // Objeto cell já tem lider_nome, etc.
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setEditingCell(null);
  };

  // --- Handlers Ações CRUD ---
  const handleFormSubmit = async (formData) => {
      setIsSubmitting(true);
      const action = editingCell ? 'atualizar' : 'criar';
      const apiCall = editingCell
          ? updateCell(editingCell.id, formData) // <-- Usa API Real
          : createCell(formData); // <-- Usa API Real

      try {
          const result = await apiCall;
          toast.success(result.message || `Célula ${action === 'criar' ? 'criada' : 'atualizada'} com sucesso!`);
          handleCloseModal();
          fetchCells(); // Recarrega a lista
      } catch (err) {
          console.error(`Erro ao ${action} célula:`, err);
          const message = err.response?.data?.message || err.message || `Falha ao ${action} célula.`;
          toast.error(message);
          // Mantém modal aberto em caso de erro
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteCell = async (id) => {
       if (!window.confirm(`Tem certeza que deseja excluir a Célula ID ${id}? Membros associados perderão o vínculo.`)) return;
       
       try {
           const response = await deleteCell(id); // <-- Usa API Real
           toast.success(response.message || "Célula excluída com sucesso!");
           fetchCells(); // Recarrega a lista
       } catch (error) {
            console.error(`Erro ao excluir célula ${id}:`, error);
            const message = error.response?.data?.message || error.message || 'Falha ao excluir célula.';
            toast.error(message);
       }
  };

  // --- Renderização ---
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Gerenciamento de Células</h1>
        <Button variant="primary" onClick={handleShowCreateModal}>
          <i className="bi bi-plus-lg me-2"></i>Nova Célula
        </Button>
      </div>

      {isLoading && (
          <div className="text-center">
               <Spinner animation="border" role="status"><span className="visually-hidden">Carregando...</span></Spinner>
          </div>
      )}
      {error && <Alert variant="danger">Erro: {error}</Alert>}

      {!isLoading && !error && (
          <Card>
              <Card.Header>Lista de Células</Card.Header>
              <Card.Body>
                {cells.length === 0 ? (
                    <Alert variant="info">Nenhuma célula encontrada.</Alert>
                ) : (
                    <Table striped bordered hover responsive="sm">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Líder</th>
                                <th>Bairro</th>
                                <th>Rua</th>
                                <th>Total Membros</th>
                                <th className="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cells.map((cell) => (
                                <tr key={cell.id}>
                                    <td>{cell.nome}</td>
                                    <td>{cell.lider_nome || '-'}</td>
                                    <td>{cell.bairro || '-'}</td>
                                    <td>{cell.rua || '-'}</td>
                                    <td>{cell.total_membros || 0}</td>
                                    <td className="text-center">
                                        <Button 
                                            variant="warning" 
                                            size="sm" 
                                            className="me-2" 
                                            onClick={() => handleShowEditModal(cell)}
                                            title="Editar Célula"
                                        >
                                            <i className="bi bi-pencil-fill"></i>
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => handleDeleteCell(cell.id)}
                                            title="Excluir Célula"
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
                {/* TODO: Adicionar Paginação se necessário no futuro */}
            </Card>
        )}

        {/* --- Modal Criar/Editar --- */}
        <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    {editingCell ? 'Editar Célula' : 'Criar Nova Célula'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <CellForm 
                    key={editingCell ? editingCell.id : 'new'} // Força remontagem do form ao mudar
                    initialData={editingCell} 
                    onSubmit={handleFormSubmit} 
                    isLoading={isSubmitting} 
                    // onCancel={handleCloseModal} // Passar se adicionar botão cancelar no CellForm
                />
            </Modal.Body>
        </Modal>

    </div>
  );
}

export default CellManagementPage; 