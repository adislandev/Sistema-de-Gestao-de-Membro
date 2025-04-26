import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { changePassword } from '../services/api'; // Importa a função da API
import { toast } from 'react-toastify'; // Importa toast

function ProfilePage() {
  const { user } = useAuth(); // Não precisamos do logout aqui diretamente
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChangePasswordSubmit = async (passwordData) => {
    // console.log("Dados para alterar senha:", passwordData);
    setIsLoading(true);
    setError(null);

    try {
      // Remove a simulação
      // await new Promise(resolve => setTimeout(resolve, 1000));
      // console.log("Simulação de troca de senha OK");
      // setSuccessMessage('Senha alterada com sucesso! (Simulação)');
      
      // Chama a função real da API
      const response = await changePassword(passwordData); 
      toast.success(response.message || 'Senha alterada com sucesso!');
      setError(null); // Limpa erros anteriores em caso de sucesso
      // Poderia limpar os campos do formulário aqui se desejado

    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      // Exibe o erro vindo da API
      const errorMessage = err.response?.data?.message || 'Erro ao alterar senha. Verifique a senha atual ou tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage); // Exibe toast de erro
      // Remove placeholder de erro
      // setError('Erro simulado ao alterar senha.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verifica se o usuário está carregado (melhorado)
  const { isLoading: isLoadingUser } = useAuth(); // Pega isLoading do contexto
  if (isLoadingUser) {
    return <div className="container mt-3">Carregando perfil...</div>;
  }
  if (!user) {
    // Se não está carregando e não tem usuário, algo deu errado (ex: token inválido na carga inicial)
    return <div className="container mt-3">Não foi possível carregar os dados do usuário. Tente fazer login novamente.</div>;
  }

  return (
    // Estrutura Bootstrap
    <div className="container mt-4">
      <div className="row">
        {/* Coluna para informações do usuário */}
        <div className="col-md-5 mb-4">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Perfil</h2>
              <p><strong>Usuário:</strong> {user.username}</p>
              <p><strong>Membro desde:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Coluna para formulário de alteração de senha */}
        <div className="col-md-7">
           <div className="card">
             <div className="card-body">
                <ChangePasswordForm 
                    onSubmit={handleChangePasswordSubmit}
                    isLoading={isLoading}
                    error={error}
                />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 