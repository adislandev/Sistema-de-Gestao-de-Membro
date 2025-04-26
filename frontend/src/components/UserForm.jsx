import React, { useState, useEffect } from 'react';

// initialData: null para criar, objeto user para editar
// onSubmit: função a ser chamada com os dados do formulário
// onCancel: função para fechar/cancelar
// isLoading: para desabilitar botão de submit
function UserForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Senha para criação
  const [role, setRole] = useState('member'); // Padrão 'member'
  // ADICIONAR: Estados para nova senha na edição
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(''); // Erro de validação local

  const isEditing = !!initialData; // Verifica se está em modo de edição

  // Efeito para preencher o formulário quando estiver editando ou criando
  useEffect(() => {
    if (isEditing) {
      setUsername(initialData.username);
      setRole(initialData.role);
      setPassword(''); // Não preenche senha antiga
    } else {
      // Reset para modo de criação
      setUsername('');
      setPassword('');
      setRole('member');
    }
    // Limpa sempre os campos de nova senha e erros ao mudar modo/dados
    setNewPassword('');
    setConfirmPassword('');
    setError(''); 
  }, [initialData, isEditing]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(''); // Limpa erros

    // Validação básica
    if (!username || !role) {
      setError('Nome de usuário e Papel são obrigatórios.');
      return;
    }
    
    // Validação senha para CRIAÇÃO
    if (!isEditing && !password) {
      setError('Senha é obrigatória ao criar um usuário.');
      return;
    }
    
    // Validação senha para EDIÇÃO (se preenchida)
    if (isEditing && newPassword) { 
        if (newPassword !== confirmPassword) {
            setError('A nova senha e a confirmação não coincidem.');
            return;
        }
        // Opcional: Adicionar validação de força da senha aqui
    }

    // Monta o objeto formData
    const formData = {
        username,
        role,
    };

    // Adiciona a senha ao formData dependendo do modo
    if (!isEditing && password) {
        // Modo Criação: usa 'password'
        formData.password = password;
    } else if (isEditing && newPassword) {
        // Modo Edição: usa 'password' se newPassword foi preenchido
        formData.password = newPassword;
    }
    
    onSubmit(formData); // Chama a função submit da página pai
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="user-username" className="form-label">Nome de Usuário</label>
        <input
          type="text"
          id="user-username"
          className="form-control"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      
      {/* Campo de Senha - Apenas para CRIAÇÃO */}
      {!isEditing && (
          <div className="mb-3">
              <label htmlFor="user-password" className="form-label">Senha</label>
              <input
                  type="password"
                  id="user-password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEditing} // Obrigatório apenas na criação
              />
              <div className="form-text">A senha é obrigatória ao criar um novo usuário.</div>
          </div>
      )}
      
      {/* Campos de Nova Senha - Apenas para EDIÇÃO */}
      {isEditing && (
          <>
              <div className="mb-3">
                  <label htmlFor="user-new-password" className="form-label">Nova Senha (Opcional)</label>
                  <input
                      type="password"
                      id="user-new-password"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      aria-describedby="newPasswordHelp"
                  />
                  <div id="newPasswordHelp" className="form-text">
                      Deixe em branco para não alterar a senha atual.
                  </div>
              </div>
              <div className="mb-3">
                  <label htmlFor="user-confirm-password" className="form-label">Confirmar Nova Senha</label>
                  <input
                      type="password"
                      id="user-confirm-password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={!newPassword} // Desabilita se nova senha estiver vazia
                  />
              </div>
          </>
      )}

      <div className="mb-3">
          <label htmlFor="user-role" className="form-label">Papel (Role)</label>
          <select 
              id="user-role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
          >
              <option value="member">User</option>
              <option value="admin">Admin</option>
          </select>
      </div>

      {error && <p className="text-danger">{error}</p>}

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar Usuário' : 'Criar Usuário')}
        </button>
      </div>
    </form>
  );
}

export default UserForm; 