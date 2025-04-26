import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import MemberForm from '../components/MemberForm';
import SelectDepartmentsModal from '../components/SelectDepartmentsModal';
import SelectCellModal from '../components/SelectCellModal';
import { toast } from 'react-toastify';

// Importa a função createMember real da API
import { createMember } from '../services/api';

// Remove o Placeholder da função da API
/*
const createMemberPlaceholder = async (memberData) => {
  console.log("[API Placeholder] Criando membro:", memberData);
  await new Promise(res => setTimeout(res, 700)); // Simula delay
  // throw new Error('Falha simulada ao cadastrar membro!'); // Descomente para testar erro
  return { ...memberData, id: Date.now(), message: 'Membro cadastrado com sucesso! (Simulado)' };
};
*/

function MemberCreatePage() {
  // Remove log de depuração
  // console.log('[MemberCreatePage] Function component called.'); 

  // Obtém a função navigate
  const navigate = useNavigate(); 

  const [isLoading, setIsLoading] = useState(false);
  // Novos estados para o modal de seleção
  const [showSelectDeptsModal, setShowSelectDeptsModal] = useState(false);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  // Novos estados para o modal de célula
  const [showSelectCellModal, setShowSelectCellModal] = useState(false);
  const [selectedCellId, setSelectedCellId] = useState(null); // Guarda ID ou null

  const handleCreateSubmit = async (formData, clearForm) => {
    setIsLoading(true);
    const payload = {
        ...formData,
        departmentIds: selectedDepartmentIds,
        celula_id: selectedCellId // <-- Inclui o ID da célula (pode ser null)
    };
    
    try {
        const response = await createMember(payload); 
        
        toast.success(response.message || 'Membro cadastrado com sucesso!');
        clearForm(); 
        setSelectedDepartmentIds([]); 
        setSelectedCellId(null); // <-- Limpa célula selecionada

        // Redireciona para a lista de membros
        navigate('/membros'); 

    } catch (error) {
        console.error("Erro ao cadastrar membro:", error);
        const message = error.response?.data?.message || error.message || 'Falha ao cadastrar membro.';
        toast.error(message);
    } finally {
        setIsLoading(false);
    }
  };

  // --- Handlers Modal Seleção Departamentos ---
  const handleOpenSelectDeptsModal = () => { setShowSelectDeptsModal(true); };
  const handleCloseSelectDeptsModal = () => { setShowSelectDeptsModal(false); };
  const handleDepartmentsSelected = (ids) => {
      setSelectedDepartmentIds(ids);
      toast.info(`${ids.length} departamento(s) selecionado(s).`);
  };

  // --- Handlers Modal Seleção Célula ---
  const handleOpenSelectCellModal = () => { setShowSelectCellModal(true); };
  const handleCloseSelectCellModal = () => { setShowSelectCellModal(false); };
  const handleCellSelected = (id) => {
      setSelectedCellId(id); // Guarda o ID ou null
      if (id) {
          // Opcional: Buscar nome da célula para exibir?
          toast.info(`Célula selecionada.`); 
      } else {
          toast.info('Nenhuma célula selecionada.');
      }
  };

  // DEBUG: Verifica se a função de renderização está sendo chamada
  console.log('[MemberCreatePage] Rendering...');

  return (
    <div className="container mt-4">
      <h1>Cadastro de Membros</h1>
      <Card className="mt-3">
        <Card.Header>Informações do Membro</Card.Header>
        <Card.Body>
          <MemberForm 
            onSubmit={handleCreateSubmit} 
            isLoading={isLoading} 
            onSelectDepartmentsClick={handleOpenSelectDeptsModal}
            onSelectCellClick={handleOpenSelectCellModal}
          />
          <div className="mt-2 text-muted small">
              {selectedDepartmentIds.length > 0 && `Departamentos pré-selecionados: ${selectedDepartmentIds.length}`}
          </div>
        </Card.Body>
      </Card>

      <SelectDepartmentsModal 
        show={showSelectDeptsModal}
        onHide={handleCloseSelectDeptsModal}
        onSubmit={handleDepartmentsSelected}
        initialSelectedIds={selectedDepartmentIds}
        isLoading={isLoading}
      />
      
      <SelectCellModal
        show={showSelectCellModal}
        onHide={handleCloseSelectCellModal}
        onSubmit={handleCellSelected}
        initialSelectedId={selectedCellId}
        isLoading={isLoading}
      />
    </div>
  );
}

export default MemberCreatePage; 