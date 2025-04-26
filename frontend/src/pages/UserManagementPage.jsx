import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, deleteUser, createUserByAdmin, updateUserByAdmin } from '../services/api'; // Importa deleteUser
import { toast } from 'react-toastify'; // Para erros
import UserForm from '../components/UserForm'; // Importa o novo componente

function UserManagementPage() {
  const { user: loggedInUser } = useAuth(); // Renomeia user para evitar conflito no map
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Estado para o modal/formulário
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null para criar, objeto user para editar

  // Função para buscar usuários (usando useCallback para evitar recriação)
  const fetchUsers = useCallback(async () => {
    if (loggedInUser?.role !== 'admin') {
      setError('Acesso não autorizado.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("[UserManagement] Erro ao buscar usuários:", err);
      const message = err.response?.data?.message || 'Falha ao carregar usuários.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUser]); // Depende do usuário logado

  // Efeito para buscar usuários na montagem e quando fetchUsers mudar
  useEffect(() => {
    if(loggedInUser) {
      fetchUsers();
    }
  }, [loggedInUser, fetchUsers]);

  // Handler para exclusão
  const handleDeleteUser = async (userIdToDelete) => {
    // Confirmação
    if (!window.confirm(`Tem certeza que deseja excluir o usuário com ID ${userIdToDelete}?`)) {
      return;
    }

    // Não permite auto-exclusão (verificação dupla, backend já faz)
    if (loggedInUser?.userId === userIdToDelete) {
        toast.error('Você não pode excluir sua própria conta de administrador.');
        return;
    }

    try {
      await deleteUser(userIdToDelete); // Chama a API
      toast.success(`Usuário ${userIdToDelete} excluído com sucesso!`);
      // Atualiza a lista local removendo o usuário excluído
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userIdToDelete));
      // Ou, alternativamente, chamar fetchUsers() novamente para pegar a lista atualizada do backend:
      // fetchUsers(); 
    } catch (err) {
      console.error(`Erro ao excluir usuário ${userIdToDelete}:`, err);
      const message = err.response?.data?.message || 'Falha ao excluir usuário.';
      toast.error(message);
    }
  };

  // --- Handlers para Modal/Form --- 
  const handleShowCreateModal = () => {
    setEditingUser(null); // Garante que é modo de criação
    setShowModal(true);
  };

  const handleShowEditModal = (userToEdit) => {
    setEditingUser(userToEdit);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  // Handler para submissão do formulário (será chamado pelo modal/form)
  const handleFormSubmit = async (formData) => {
    console.log("Submetendo formulário:", formData, "Editando:", editingUser);
    setIsSubmitting(true); // Inicia o estado de envio
    // Lógica para chamar createUserByAdmin ou updateUserByAdmin
    try {
        if (editingUser) {
            // Modo Edição
            const dataToUpdate = { username: formData.username, role: formData.role };
            await updateUserByAdmin(editingUser.id, dataToUpdate);
            toast.success(`Usuário ${editingUser.username} atualizado!`);
        } else {
            // Modo Criação
            await createUserByAdmin(formData);
            toast.success(`Usuário ${formData.username} criado!`);
        }
        handleCloseModal(); // Fecha modal
        fetchUsers(); // Recarrega a lista de usuários
    } catch (err) {
        console.error("Erro ao salvar usuário:", err);
        const message = err.response?.data?.message || 'Falha ao salvar usuário.';
        toast.error(message); 
        // Não fecha o modal em caso de erro para permitir correção
    } finally {
        setIsSubmitting(false); // Finaliza o estado de envio
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Gerenciamento de Usuários</h1>
        <button className="btn btn-primary" onClick={handleShowCreateModal}>
           + Novo Usuário
        </button>
      </div>

      {isLoading && <p>Carregando usuários...</p>} 
      {error && <p className="text-danger">Erro: {error}</p>}

      {!isLoading && !error && (
        <table className="table table-striped table-hover mt-3">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome de Usuário</th>
              <th>Papel (Role)</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-warning me-2" 
                    onClick={() => handleShowEditModal(user)}
                    disabled={loggedInUser?.userId === user.id}
                  >
                     Editar
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={loggedInUser?.userId === user.id}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}> {/* Estilo básico de modal overlay */}
          <div className="modal-dialog modal-dialog-centered"> {/* Centraliza o modal */}
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <UserForm
                  initialData={editingUser} // Passa os dados do usuário para edição (ou null)
                  onSubmit={handleFormSubmit} // Passa o handler de submissão
                  onCancel={handleCloseModal} // Passa o handler para cancelar
                  isLoading={isSubmitting} // Passa o estado de carregamento/submissão
                />
              </div>
              {/* O rodapé com botões agora está dentro do UserForm */}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserManagementPage; 