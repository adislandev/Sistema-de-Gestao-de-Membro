// login-app/backend/src/controllers/departamentoController.js
const pool = require('../config/db'); // Importa o pool de conexões

// Listar todos os departamentos com contagem de membros
exports.getAllDepartamentos = async (req, res) => {
    try {
        // Busca todos os departamentos, adicionando a contagem de membros
        const query = `
            SELECT
                d.id,
                d.nome,
                d.created_at,
                COUNT(md.membro_id) AS totalMembros
            FROM
                Departamentos d
            LEFT JOIN
                Membro_Departamento md ON d.id = md.departamento_id
            GROUP BY
                d.id, d.nome, d.created_at
            ORDER BY
                d.nome ASC;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar departamentos com contagem de membros:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar departamentos.' });
    }
};

// Criar um novo departamento
exports.createDepartamento = async (req, res) => {
    const { nome } = req.body;

    // Validação básica (Seguindo @codif.md)
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(400).json({ message: 'Nome do departamento é obrigatório.' });
    }
    if (nome.length > 15) {
         return res.status(400).json({ message: 'Nome do departamento não pode exceder 15 caracteres.' });
    }

    const nomeSanitizado = nome.trim(); // Sanitização básica

    try {
        // Insere o novo departamento usando query parametrizada
        const [result] = await pool.query('INSERT INTO Departamentos (nome) VALUES (?)', [nomeSanitizado]);
        
        // Retorna o ID criado e uma mensagem de sucesso
        res.status(201).json({ 
            id: result.insertId, 
            nome: nomeSanitizado, 
            message: 'Departamento criado com sucesso!' 
        });

    } catch (error) {
         // Trata erro de unicidade (nome já existe)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe um departamento com este nome.' });
        }
        console.error('Erro ao criar departamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar departamento.' });
    }
};

// Atualizar um departamento existente
exports.updateDepartamento = async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;

    // Validação básica
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(400).json({ message: 'Nome do departamento é obrigatório.' });
    }
     if (nome.length > 15) {
         return res.status(400).json({ message: 'Nome do departamento não pode exceder 15 caracteres.' });
    }

    const nomeSanitizado = nome.trim();
    const departamentoId = parseInt(id, 10); // Garante que ID é número

     if (isNaN(departamentoId)) {
        return res.status(400).json({ message: 'ID inválido.' });
    }

    try {
        // Atualiza o departamento usando query parametrizada
        const [result] = await pool.query('UPDATE Departamentos SET nome = ? WHERE id = ?', [nomeSanitizado, departamentoId]);
        
        // Verifica se alguma linha foi realmente afetada (se o ID existia)
        if (result.affectedRows === 0) {
             return res.status(404).json({ message: 'Departamento não encontrado.' });
        }
        
        // Retorna o ID atualizado e uma mensagem de sucesso
        res.json({ 
            id: departamentoId, 
            nome: nomeSanitizado, 
            message: 'Departamento atualizado com sucesso!' 
        });

    } catch (error) {
        // Trata erro de unicidade (tentou atualizar para um nome que já existe em outro registro)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe outro departamento com este nome.' });
        }
        console.error(`Erro ao atualizar departamento ${departamentoId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar departamento.' });
    }
};

// Excluir um departamento
exports.deleteDepartamento = async (req, res) => {
    const { id } = req.params;
    const departamentoId = parseInt(id, 10);

     if (isNaN(departamentoId)) {
        return res.status(400).json({ message: 'ID inválido.' });
    }
    
    try {
        // Exclui o departamento usando query parametrizada
        const [result] = await pool.query('DELETE FROM Departamentos WHERE id = ?', [departamentoId]);

        // Verifica se alguma linha foi afetada (se o ID existia)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Departamento não encontrado.' });
        }
        
        // Retorna uma mensagem de sucesso (ou pode retornar 204 No Content)
        res.status(200).json({ message: 'Departamento excluído com sucesso!' }); 

    } catch (error) {
        // TODO: Considerar tratar erros de chave estrangeira se departamentos forem ligados a outras tabelas
        // Exemplo: if (error.code === 'ER_ROW_IS_REFERENCED_2') { ... }
        console.error(`Erro ao excluir departamento ${departamentoId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir departamento.' });
    }
};

// --- Gerenciamento de Membros do Departamento --- //

// Buscar todos os membros e indicar quais pertencem a um departamento específico
exports.getDepartamentoMembers = async (req, res) => {
    const { id } = req.params; // ID do departamento
    const departamentoId = parseInt(id, 10);

    if (isNaN(departamentoId)) {
        return res.status(400).json({ message: 'ID do Departamento inválido.' });
    }

    try {
        // 1. Buscar todos os membros
        const [allMembers] = await pool.query(
            'SELECT id, nome_completo, telefone FROM Membros ORDER BY nome_completo ASC'
        );

        // 2. Buscar IDs dos membros que JÁ pertencem a este departamento
        const [linkedMemberIdsResult] = await pool.query(
            'SELECT membro_id FROM Membro_Departamento WHERE departamento_id = ?', 
            [departamentoId]
        );
        // Cria um Set para busca rápida dos IDs vinculados
        const linkedMemberIds = new Set(linkedMemberIdsResult.map(row => row.membro_id));

        // 3. Adicionar flag `pertence_ao_departamento` a cada membro
        const membersWithStatus = allMembers.map(member => ({
            ...member,
            pertence_ao_departamento: linkedMemberIds.has(member.id)
        }));

        res.json(membersWithStatus);

    } catch (error) {
        console.error(`Erro ao buscar membros para o departamento ${departamentoId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar membros do departamento.' });
    }
};

// Atualizar a lista de membros de um departamento específico
exports.updateDepartamentoMembers = async (req, res) => {
    const { id } = req.params; // ID do departamento
    const { memberIds } = req.body; // Array com os IDs dos membros que devem pertencer

    const departamentoId = parseInt(id, 10);
    if (isNaN(departamentoId)) {
        return res.status(400).json({ message: 'ID do Departamento inválido.' });
    }

    // Valida se memberIds é um array
    if (!Array.isArray(memberIds)) {
        return res.status(400).json({ message: 'Formato inválido. Esperado um array de memberIds.' });
    }
    // Valida se todos os IDs no array são números (ou podem ser convertidos)
    const validMemberIds = memberIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    // if (validMemberIds.length !== memberIds.length) { 
    //     // Opcional: Retornar erro se algum ID for inválido
    // }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Deletar todos os vínculos existentes para este departamento
        await connection.query('DELETE FROM Membro_Departamento WHERE departamento_id = ?', [departamentoId]);

        // 2. Inserir os novos vínculos (se houver)
        if (validMemberIds.length > 0) {
            // Cria array de arrays para inserção múltipla: [[membroId1, deptId], [membroId2, deptId], ...]
            const valuesToInsert = validMemberIds.map(memberId => [memberId, departamentoId]);
            await connection.query('INSERT INTO Membro_Departamento (membro_id, departamento_id) VALUES ?', [valuesToInsert]);
        }

        await connection.commit();
        connection.release();

        res.json({ message: 'Membros do departamento atualizados com sucesso!' });

    } catch (error) {
        console.error(`Erro ao atualizar membros do departamento ${departamentoId}:`, error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        // Tratar erro de FK se algum memberId não existir em Membros
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Um ou mais IDs de membro fornecidos não existem.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar membros do departamento.' });
    }
}; 