import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Alert, Spinner, Pagination, Form, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MemberForm from '../components/MemberForm'; 
import ManageDepartmentMembersModal from '../components/ManageDepartmentMembersModal'; // <-- Modal errado, remover/ignorar
import SelectDepartmentsModal from '../components/SelectDepartmentsModal'; // <-- Importa o modal correto
import SelectCelulaModal from '../components/SelectCelulaModal'; // <-- Importa o novo modal

// Importa funções da API
import { getAllDepartments, getAllCells, getMembers, updateMember, deleteMember } from '../services/api';
// TODO: Importar getMembers, updateMember, deleteMember quando forem criadas

function MemberManagementPage() {
  const navigate = useNavigate();
  // Estados
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cells, setCells] = useState([]);
  const [filters, setFilters] = useState({ nome: '', departamentoId: '', celulaId: '' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Estados do Modal de Edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  // Estado para IDs de departamento do membro sendo editado
  const [editingMemberDeptIds, setEditingMemberDeptIds] = useState([]); 
  const [editingMemberCellId, setEditingMemberCellId] = useState(null); // <-- NOVO ESTADO para célula

  // Estado para o modal de SELEÇÃO de departamentos (para edição)
  const [showSelectDeptsModal, setShowSelectDeptsModal] = useState(false);
  // Estado para o modal de SELEÇÃO de células (para edição)
  const [showSelectCelulaModal, setShowSelectCelulaModal] = useState(false); // <-- NOVO ESTADO

  // Busca inicial de dados (departamentos, celulas e primeira página de membros)
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [deptData, cellData] = await Promise.all([
            getAllDepartments(),
            getAllCells()
        ]);
        setDepartments(deptData || []);
        setCells(cellData || []);
        await fetchMembers(1); // Busca a primeira página com filtros vazios
    } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
        const message = err.message || 'Falha ao carregar dados.';
        setError(message);
        toast.error(message);
    } finally {
        setIsLoading(false);
    }
  }, []); // Dependência vazia para rodar só na montagem

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Busca membros com base nos filtros e paginação
  const fetchMembers = useCallback(async (page = 1) => {
    setIsLoading(true); 
    setError(null);
    // Limpa filtros vazios para não enviar ?nome=&celulaId=
    const cleanFilters = {};
    if (filters.nome) cleanFilters.nome = filters.nome;
    if (filters.departamentoId) cleanFilters.departamentoId = filters.departamentoId;
    if (filters.celulaId) cleanFilters.celulaId = filters.celulaId;
    
    const params = { 
        page,
        limit: 5, 
        ...cleanFilters 
    };
    try {
        const data = await getMembers(params); // <-- Usa a função REAL da API
        // const data = await getMembersPlaceholder(params); // Remove PLACEHOLDER
        setMembers(data.membros || []);
        setPagination({
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || 1,
            totalItems: data.totalItems || 0
        });
    } catch (err) {
        console.error("Erro ao buscar membros:", err);
        const message = err.message || 'Falha ao buscar membros.';
        setError(message);
        toast.error(message);
        setMembers([]); // Limpa membros em caso de erro
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 }); // Reseta paginação
    } finally {
       setIsLoading(false);
    }
  }, [filters]); // Depende dos filtros para refazer a busca quando eles mudam

  // --- Handlers Filtros ---
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchMembers(1); // Busca a primeira página com os novos filtros
  };

  const handleClearFilters = () => {
    setFilters({ nome: '', departamentoId: '', celulaId: '' });
    // Idealmente, fetchMembers seria chamado automaticamente devido à mudança no estado filters
    // Mas para garantir, podemos chamar explicitamente após limpar
    // setTimeout(() => fetchMembers(1), 0); // Pequeno delay para garantir que o estado atualizou
    // Ou ajustar a dependência do useCallback de fetchMembers
    fetchMembers(1); // Tentativa direta
  };

  // --- Handlers Modal Edição MEMBRO ---
  const handleShowEditModal = (member) => {
    // Prepara os dados para o formulário
    const initialDataForForm = {
        ...member,
        data_nascimento: member.data_nascimento ? member.data_nascimento.split('T')[0] : '',
        // celula_id será usado pelo MemberForm internamente
        celula_id: member.celula_id 
    };
    setEditingMember(initialDataForForm); // Passa dados para o formulário
    // Guarda os IDs de departamento atuais para pré-selecionar no modal de seleção
    setEditingMemberDeptIds(member.departamento_ids || []); 
    // Guarda o ID da célula atual para pré-selecionar no modal de seleção de célula
    setEditingMemberCellId(member.celula_id === null || member.celula_id === undefined ? null : member.celula_id); // <-- Guarda célula ID
    setShowEditModal(true); // Abre o modal principal de edição do membro
  };

  const handleCloseEditModal = () => {
    if (isSubmittingEdit) return;
    setShowEditModal(false);
    setEditingMember(null);
    setEditingMemberDeptIds([]); // Limpa os IDs ao fechar
    setEditingMemberCellId(null); // <-- Limpa célula ID ao fechar
  };
  
  // Submit do formulário PRINCIPAL de edição de membro
  const handleEditSubmit = async (formData) => { 
      setIsSubmittingEdit(true);
      // Monta o payload final incluindo os IDs de departamento E o ID da célula
      const payload = {
          ...formData, // Vem do MemberForm (nome, telefone, data_nasc)
          departmentIds: editingMemberDeptIds, // Vem do estado da página (atualizado pelo SelectDepartmentsModal)
          celula_id: editingMemberCellId // <-- Vem do estado da página (atualizado pelo SelectCelulaModal)
      };
      
      try {
        // Chama a API real para atualizar (que agora precisa aceitar celula_id)
        const response = await updateMember(editingMember.id, payload); 
        
        toast.success(response.message || "Membro atualizado com sucesso!");
        handleCloseEditModal();
        fetchMembers(pagination.currentPage); // Recarrega página atual

      } catch(error) {
          console.error(`Erro ao atualizar membro ${editingMember.id}:`, error);
          const message = error.response?.data?.message || error.message || 'Falha ao atualizar membro.';
          toast.error(message);
      } finally {
          setIsSubmittingEdit(false);
      }
  };

  // --- Handlers Modal SELEÇÃO de Departamentos (para edição) ---
  const handleOpenSelectDeptsModalForEdit = () => {
      setShowSelectDeptsModal(true);
  };

  const handleCloseSelectDeptsModal = () => {
       setShowSelectDeptsModal(false);
  };

  const handleEditDepartmentsSelected = (selectedIds) => {
      setEditingMemberDeptIds(selectedIds); 
      toast.info(`${selectedIds.length} departamento(s) selecionado(s) para este membro.`);
      // Não precisa fechar o modal aqui, ele já se fecha
  };

  // --- Handlers Modal SELEÇÃO de Célula (para edição) --- <--- NOVA SEÇÃO
  const handleOpenSelectCelulaModal = () => {
      setShowSelectCelulaModal(true);
  };

  const handleCloseSelectCelulaModal = () => {
      setShowSelectCelulaModal(false);
  };

  // Chamado quando o usuário confirma a seleção no SelectCelulaModal
  const handleCelulaSelected = (selectedId) => {
      setEditingMemberCellId(selectedId); // Atualiza o ID da célula no estado da página
      const selectedCell = cells.find(c => c.id === selectedId);
      if (selectedCell) {
          toast.info(`Célula "${selectedCell.nome}" selecionada.`);
      } else if (selectedId === null) {
          toast.info('Associação de célula removida.');
      }
      // Não precisa fechar o modal aqui, ele já se fecha
  };

  // --- Handler Exclusão ---
  const handleDeleteMember = async (id) => {
       if (!window.confirm(`Tem certeza que deseja excluir o membro ID ${id}?`)) return;
       
       // Pode-se adicionar um estado de loading específico para a linha/botão aqui
       // setIsLoading(true); // Usando loading geral por enquanto
       try {
            // Chama API real para excluir
            const response = await deleteMember(id); 
            toast.success(response.message || "Membro excluído com sucesso!");
            // Recarrega a lista, idealmente voltando para página 1 se a página atual ficar vazia
            // Lógica simplificada: recarrega a página atual ou a anterior se for a última página e só tinha 1 item
            const newPage = (members.length === 1 && pagination.currentPage > 1) 
                            ? pagination.currentPage - 1 
                            : pagination.currentPage;
            fetchMembers(newPage); 
       } catch (error) {
            console.error(`Erro ao excluir membro ${id}:`, error);
            const message = error.response?.data?.message || error.message || 'Falha ao excluir membro.';
            toast.error(message);
       } finally {
            // setIsLoading(false);
       }
  };
  
  // --- Handler Paginação ---
  const handlePageChange = (pageNumber) => {
    fetchMembers(pageNumber);
  };

  // --- Renderização ---
  return (
    <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>Gerenciamento de Membros</h1>
            <Button variant="success" onClick={() => navigate('/membros/novo')}>
                 <i className="bi bi-person-plus-fill me-2"></i>Cadastrar Membro
            </Button>
        </div>

        {/* Card de Filtros */}
        <Card className="mb-4">
            <Card.Header>Filtros</Card.Header>
            <Card.Body>
                <Form>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group controlId="filter-nome">
                                <Form.Label>Nome</Form.Label>
                                <Form.Control 
                                    type="text"
                                    name="nome"
                                    value={filters.nome}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                             <Form.Group controlId="filter-departamento">
                                <Form.Label>Departamento</Form.Label>
                                <Form.Select 
                                    name="departamentoId"
                                    value={filters.departamentoId}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Todos</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.nome}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                         <Col md={3}>
                             <Form.Group controlId="filter-celula">
                                <Form.Label>Célula</Form.Label>
                                <Form.Select 
                                    name="celulaId"
                                    value={filters.celulaId}
                                    onChange={handleFilterChange}
                                >
                                     <option value="">Todas</option>
                                     {cells.map(cell => (
                                        <option key={cell.id} value={cell.id}>{cell.nome}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end gap-2">
                            <Button variant="primary" onClick={handleApplyFilters} className="w-100">
                                <i className="bi bi-search me-1"></i> Filtrar
                            </Button>
                             <Button variant="secondary" onClick={handleClearFilters} className="w-100">
                                <i className="bi bi-x-lg me-1"></i> Limpar
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card.Body>
        </Card>

        {/* Seção da Lista */}
        {isLoading && (
            <div className="text-center">
                 <Spinner animation="border" role="status"><span className="visually-hidden">Carregando...</span></Spinner>
            </div>
        )}
        {error && <Alert variant="danger">Erro: {error}</Alert>}
        
        {!isLoading && !error && (
            <Card>
                 <Card.Header>Lista de Membros ({pagination.totalItems} encontrados)</Card.Header>
                 <Card.Body>
                    {members.length === 0 ? (
                        <Alert variant="info">Nenhum membro encontrado com os filtros aplicados.</Alert>
                    ) : (
                        <Table striped bordered hover responsive="sm">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Telefone</th>
                                    <th>Data Nasc.</th>
                                    <th>Departamentos</th>
                                    <th>Célula</th>
                                    <th className="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.nome_completo}</td>
                                        <td>{member.telefone || '-'}</td>
                                        <td>
                                            {(() => {
                                                const dateStr = member.data_nascimento;
                                                // Tratamento alternativo para 'YYYY-MM-DD'
                                                // Cria a data como UTC para evitar shifts de timezone, depois formata localmente
                                                const dateParts = dateStr ? dateStr.split('-') : null;
                                                // Cria o Date usando UTC (mês é 0-indexado)
                                                const date = dateParts ? new Date(Date.UTC(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10))) : null;
                                                // Retorna a data formatada APENAS se date for válido
                                                return date && !isNaN(date.getTime()) ? date.toLocaleDateString() : '-';
                                            })()}
                                        </td>
                                        <td>{member.departamentos_nomes || '-'}</td>
                                        <td>{member.celula_nome || '-'}</td>
                                        <td className="text-center">
                                            <Button 
                                                variant="warning" 
                                                size="sm" 
                                                className="me-2" 
                                                onClick={() => handleShowEditModal(member)}
                                                title="Editar Membro"
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button 
                                                variant="danger" 
                                                size="sm"
                                                onClick={() => handleDeleteMember(member.id)}
                                                title="Excluir Membro"
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
                 {pagination.totalPages > 1 && (
                    <Card.Footer className="d-flex justify-content-center">
                        <Pagination>
                            {[...Array(pagination.totalPages).keys()].map(page => (
                                <Pagination.Item 
                                    key={page + 1} 
                                    active={page + 1 === pagination.currentPage}
                                    onClick={() => handlePageChange(page + 1)}
                                >
                                    {page + 1}
                                </Pagination.Item>
                            ))}
                        </Pagination>
                    </Card.Footer>
                 )}
            </Card>
        )}

        {/* --- Modal de Edição de MEMBRO --- */}
        {/* Renderiza o modal principal se um membro estiver sendo editado */}
        <Modal show={showEditModal} onHide={handleCloseEditModal} backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title>Editar Membro</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {editingMember ? (
                    <MemberForm
                        initialData={editingMember}
                        onSubmit={handleEditSubmit}
                        onCancel={handleCloseEditModal}
                        isLoading={isSubmittingEdit}
                        cells={cells}
                        onSelectDepartmentsClick={handleOpenSelectDeptsModalForEdit}
                        onSelectCellClick={handleOpenSelectCelulaModal}
                    />
                ) : (
                    <p>Carregando dados do membro...</p>
                )}
            </Modal.Body>
        </Modal>

         {/* --- Modal de SELEÇÃO de Departamentos (para edição) --- */}
         {/* Renderiza o modal de seleção se showSelectDeptsModal for true */}
         <SelectDepartmentsModal 
            show={showSelectDeptsModal}
            onHide={handleCloseSelectDeptsModal}
            onSubmit={handleEditDepartmentsSelected} // Handler para receber os IDs
            initialSelectedIds={editingMemberDeptIds} // Passa os IDs atuais para pré-seleção
            isLoading={isSubmittingEdit} // Desabilita se o form principal estiver salvando
        />

        {/* Modal de Seleção de Célula (para Edição) */}
        {editingMember && (
            <SelectCelulaModal 
                show={showSelectCelulaModal}
                onHide={handleCloseSelectCelulaModal}
                onSubmit={handleCelulaSelected} // <-- Usa a nova função de callback
                cells={cells} // <-- Passa a lista de células carregada na página
                initialSelectedId={editingMemberCellId} // <-- Passa o ID da célula atual do membro
                isLoadingParent={isSubmittingEdit} // Passa loading do submit principal
            />
        )}

    </div>
  );
}

export default MemberManagementPage; 