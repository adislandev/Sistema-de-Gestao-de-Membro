import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { AsyncTypeahead } from 'react-bootstrap-typeahead'; // Importa o componente

// Importa a função da API para buscar membros (necessária para o typeahead)
import { getMembers } from '../services/api'; 

function CellForm({ onSubmit, isLoading, initialData = null }) {
  const [nome, setNome] = useState('');
  const [bairro, setBairro] = useState('');
  const [rua, setRua] = useState('');
  
  // Estado para o Typeahead de Líder
  const [isSearchingLeader, setIsSearchingLeader] = useState(false);
  const [leaderOptions, setLeaderOptions] = useState([]);
  // Guarda o objeto completo do líder selecionado [{id: ..., nome_completo: ...}]
  const [selectedLeader, setSelectedLeader] = useState([]); 
  
  const [error, setError] = useState(''); // Erro de validação local
  const isEditing = !!initialData;

  // Preenche formulário na edição
  useEffect(() => {
    if (isEditing) {
      setNome(initialData.nome || '');
      setBairro(initialData.bairro || '');
      setRua(initialData.rua || '');
      // Se tiver dados iniciais do líder, pré-seleciona no typeahead
      if (initialData.lider_id && initialData.lider_nome) {
          setSelectedLeader([{ id: initialData.lider_id, nome_completo: initialData.lider_nome }]);
          // Se só tivéssemos o ID, precisaríamos buscar o nome do líder aqui
      } else {
           setSelectedLeader([]);
      }
    } else {
      setNome('');
      setBairro('');
      setRua('');
      setSelectedLeader([]);
    }
    setError('');
  }, [initialData, isEditing]);

  // Função para buscar líderes no typeahead
  const handleLeaderSearch = async (query) => {
    setIsSearchingLeader(true);
    try {
      // Busca membros filtrando pelo nome digitado
      const response = await getMembers({ nome: query, limit: 10 }); // Limita resultados
      // Formata para o typeahead (precisa de um label)
      const options = response.membros.map(m => ({ 
          id: m.id, 
          nome_completo: m.nome_completo, 
          // label: `${m.nome_completo} (ID: ${m.id})` // Label não é mais necessário se usarmos nome_completo
      }));
      setLeaderOptions(options);
    } catch (err) {
        console.error("Erro ao buscar líderes:", err);
        // Poderia exibir um toast ou erro discreto
        setLeaderOptions([]); // Limpa opções em caso de erro
    } finally {
        setIsSearchingLeader(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    // Validação
    const trimmedNome = nome.trim();
    if (!trimmedNome) {
      return setError('O nome da célula é obrigatório.');
    }
    if (selectedLeader.length === 0) {
        return setError('É obrigatório selecionar um líder.');
    }
    
    const formData = {
      nome: trimmedNome,
      lider_id: selectedLeader[0].id, // Pega o ID do líder selecionado
      bairro: bairro.trim() || null,
      rua: rua.trim() || null,
    };
    onSubmit(formData); 
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group className="mb-3" controlId="cell-name">
        <Form.Label>Nome da Célula *</Form.Label>
        <Form.Control
          type="text"
          placeholder="Digite o nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={100}
          required
          autoFocus
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="cell-leader">
        <Form.Label>Líder *</Form.Label>
        <AsyncTypeahead
          id="leader-typeahead"
          isLoading={isSearchingLeader}
          options={leaderOptions} // Opções encontradas pela busca
          labelKey="nome_completo" // <-- Usa o nome completo como chave principal e para exibição no input
          minLength={2} // Começa a buscar após digitar 2 caracteres
          onSearch={handleLeaderSearch} // Função chamada ao digitar
          onChange={setSelectedLeader} // Atualiza o líder selecionado (retorna array)
          selected={selectedLeader} // Array com o líder atualmente selecionado
          placeholder="Digite o nome do membro para buscar..."
          // filterBy={() => true} // Desativa filtro local, confia na busca da API
          renderMenuItemChildren={(option) => (
             <span>{option.nome_completo}</span> // <-- Mostra apenas o nome no dropdown
          )}
          useCache={false} // Evita cache se os dados mudam muito
        />
         <Form.Text muted>
          Digite pelo menos 2 caracteres para buscar um membro cadastrado.
        </Form.Text>
      </Form.Group>
      
       <Form.Group className="mb-3" controlId="cell-bairro">
        <Form.Label>Bairro</Form.Label>
        <Form.Control
          type="text"
          placeholder="Digite o bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          maxLength={100}
        />
      </Form.Group>
      
       <Form.Group className="mb-3" controlId="cell-rua">
        <Form.Label>Rua</Form.Label>
        <Form.Control
          type="text"
          placeholder="Digite a rua"
          value={rua}
          onChange={(e) => setRua(e.target.value)}
          maxLength={100}
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 mt-4">
        {/* TODO: Adicionar botão Cancelar se necessário (passar prop onCancel) */}
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="ms-1">{isEditing ? 'Atualizando...' : 'Salvando...'}</span>
            </>
          ) : (isEditing ? 'Atualizar Célula' : 'Criar Célula')}
        </Button>
      </div>
    </Form>
  );
}

export default CellForm; 