const pool = require('../config/db'); // Importa o pool de conexões

// Criar um novo membro e associar a departamentos/célula (se fornecido)
exports.createMembro = async (req, res) => {
    // Adiciona celula_id
    let { nome_completo, data_nascimento, telefone, celula_id, departmentIds } = req.body; 

    // --- Validação Membro (igual a antes) ---
    if (!nome_completo || typeof nome_completo !== 'string' || nome_completo.trim().length === 0) return res.status(400).json({ message: 'Nome completo é obrigatório.' });
    nome_completo = nome_completo.trim();
    if (nome_completo.length > 30) return res.status(400).json({ message: 'Nome completo não pode exceder 30 caracteres.' });
    if (telefone && typeof telefone === 'string') {
        telefone = telefone.trim();
        if (telefone.length === 0) telefone = null;
        else if (telefone.length > 20) return res.status(400).json({ message: 'Telefone não pode exceder 20 caracteres.' });
    } else telefone = null;
    if (data_nascimento && typeof data_nascimento === 'string' && data_nascimento.trim().length > 0) {
        data_nascimento = data_nascimento.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data_nascimento)) return res.status(400).json({ message: 'Formato inválido para Data de Nascimento. Use AAAA-MM-DD.' });
        const dateObj = new Date(data_nascimento);
        if (isNaN(dateObj.getTime())) return res.status(400).json({ message: 'Data de Nascimento inválida.' });
    } else data_nascimento = null;
    // --- Fim Validação Membro ---
    
     // --- Validação Célula (Opcional) ---
    let validCelulaId = null; // Default para NULL
    if (celula_id !== undefined && celula_id !== null && celula_id !== '') {
        validCelulaId = parseInt(celula_id, 10);
        if (isNaN(validCelulaId)) {
            return res.status(400).json({ message: 'ID da Célula inválido.' });
        }
    } // Se for undefined, null ou '', permanece null
    // --- Fim Validação Célula ---

    // --- Validação Departamentos (igual a antes) ---
    let validDepartmentIds = [];
    if (departmentIds) { 
        if (!Array.isArray(departmentIds)) return res.status(400).json({ message: 'departmentIds deve ser um array.' });
        validDepartmentIds = departmentIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    }
    // --- Fim Validação Departamentos ---

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Insere o novo membro (incluindo celula_id)
        const [result] = await connection.query(
            'INSERT INTO Membros (nome_completo, data_nascimento, telefone, celula_id) VALUES (?, ?, ?, ?)', 
            [nome_completo, data_nascimento, telefone, validCelulaId] // Passa validCelulaId (pode ser null)
        );
        const newMemberId = result.insertId;

        // 2. Insere os vínculos com departamentos (se houver)
        if (validDepartmentIds.length > 0) {
            const valuesToInsert = validDepartmentIds.map(deptId => [newMemberId, deptId]);
            await connection.query('INSERT INTO Membro_Departamento (membro_id, departamento_id) VALUES ?', [valuesToInsert]);
        }
        
        await connection.commit();
        connection.release();
        
        res.status(201).json({ 
            id: newMemberId, 
            nome_completo, 
            data_nascimento,
            telefone,
            celula_id: validCelulaId,
            message: 'Membro cadastrado com sucesso!' 
        });

    } catch (error) {
        console.error('Erro ao cadastrar membro:', error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
         // Tratar erro de FK se algum departmentId ou celula_id não existir
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'ID de Departamento ou Célula fornecido é inválido.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar membro.' });
    }
};

// Listar todos os membros com filtros e paginação
exports.getAllMembros = async (req, res) => {
    const { nome, departamentoId, celulaId, page = 1, limit = 10 } = req.query;

    try {
        const currentPage = parseInt(page, 10);
        const itemsPerPage = parseInt(limit, 10);
        const offset = (currentPage - 1) * itemsPerPage;

        // Query principal para buscar dados + nomes concatenados + IDs concatenados
        let baseQuery = `
            SELECT 
                Membros.id, 
                Membros.nome_completo, 
                Membros.data_nascimento, 
                Membros.telefone, 
                Membros.celula_id, 
                Celulas.nome as celula_nome, 
                GROUP_CONCAT(DISTINCT Departamentos.id ORDER BY Departamentos.nome SEPARATOR ',') as departamento_ids,
                GROUP_CONCAT(DISTINCT Departamentos.nome ORDER BY Departamentos.nome SEPARATOR ', ') as departamentos_nomes
            FROM Membros
            LEFT JOIN Celulas ON Membros.celula_id = Celulas.id
            LEFT JOIN Membro_Departamento ON Membros.id = Membro_Departamento.membro_id
            LEFT JOIN Departamentos ON Membro_Departamento.departamento_id = Departamentos.id
        `;
        
        // Query para contagem (não precisa dos IDs concatenados aqui)
        let countQuery = `
            SELECT COUNT(DISTINCT Membros.id) as totalItems
            FROM Membros
            LEFT JOIN Celulas ON Membros.celula_id = Celulas.id
            LEFT JOIN Membro_Departamento ON Membros.id = Membro_Departamento.membro_id
            LEFT JOIN Departamentos ON Membro_Departamento.departamento_id = Departamentos.id
        `;

        const whereClauses = [];
        const params = [];
        const countParams = [];

        if (nome) {
            whereClauses.push('Membros.nome_completo LIKE ?');
            params.push(`%${nome}%`);
            countParams.push(`%${nome}%`);
        }
        if (departamentoId) {
            whereClauses.push('Membro_Departamento.departamento_id = ?');
            params.push(departamentoId);
            countParams.push(departamentoId);
        }
         if (celulaId) {
            whereClauses.push('Membros.celula_id = ?');
            params.push(celulaId);
            countParams.push(celulaId);
        }

        if (whereClauses.length > 0) {
            const whereString = ' WHERE ' + whereClauses.join(' AND ');
            baseQuery += whereString;
            countQuery += whereString;
        }

        // Query para contar o total de itens com os filtros aplicados
        const [countResult] = await pool.query(countQuery, countParams);
        const totalItems = countResult[0].totalItems;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Adiciona GROUP BY, ORDER BY, LIMIT e OFFSET para a query principal
        baseQuery += ` 
            GROUP BY Membros.id
            ORDER BY Membros.nome_completo ASC 
            LIMIT ? 
            OFFSET ?
        `;
        params.push(itemsPerPage, offset);

        // Query para buscar os membros paginados e filtrados
        const [membros] = await pool.query(baseQuery, params);
        
        // Converte a string de IDs para array de números
        const membrosFormatados = membros.map(m => ({
            ...m,
            departamento_ids: m.departamento_ids ? m.departamento_ids.split(',').map(id => parseInt(id, 10)) : []
        }));

        res.json({
            membros: membrosFormatados, // Envia com o array de IDs
            totalItems,
            totalPages,
            currentPage
        });

    } catch (error) {
        console.error('Erro ao buscar membros:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar membros.' });
    }
};

// Atualizar um membro existente e seus vínculos com departamentos
exports.updateMembro = async (req, res) => {
    const { id } = req.params;
    // Adiciona departmentIds
    let { nome_completo, data_nascimento, telefone, celula_id, departmentIds } = req.body; 
    
    const membroId = parseInt(id, 10);
    if (isNaN(membroId)) {
        return res.status(400).json({ message: 'ID inválido.' });
    }

    // --- Validação dos dados do membro (igual a antes) ---
    if (nome_completo !== undefined) {
        if (typeof nome_completo !== 'string' || nome_completo.trim().length === 0) return res.status(400).json({ message: 'Nome completo não pode ser vazio se fornecido.' });
        nome_completo = nome_completo.trim();
        if (nome_completo.length > 30) return res.status(400).json({ message: 'Nome completo não pode exceder 30 caracteres.' });
    } 
    if (telefone !== undefined) {
        if (telefone === null || telefone === '') telefone = null;
        else if (typeof telefone === 'string') {
            telefone = telefone.trim();
            if (telefone.length > 20) return res.status(400).json({ message: 'Telefone não pode exceder 20 caracteres.' });
        } else {
            return res.status(400).json({ message: 'Telefone inválido.' });
        }
    }
    if (data_nascimento !== undefined) {
         if (data_nascimento === null || data_nascimento === '') data_nascimento = null;
         else if (typeof data_nascimento === 'string' && data_nascimento.trim().length > 0) {
             data_nascimento = data_nascimento.trim();
             if (!/^\d{4}-\d{2}-\d{2}$/.test(data_nascimento)) return res.status(400).json({ message: 'Formato inválido para Data de Nascimento. Use AAAA-MM-DD.' });
             const dateObj = new Date(data_nascimento);
             if (isNaN(dateObj.getTime())) return res.status(400).json({ message: 'Data de Nascimento inválida.' });
         } else {
              return res.status(400).json({ message: 'Data de Nascimento inválida.' });
         }
    }
    if (celula_id !== undefined) {
        if (celula_id === null || celula_id === '') celula_id = null;
        else {
            celula_id = parseInt(celula_id, 10);
            if (isNaN(celula_id)) return res.status(400).json({ message: 'ID da Célula inválido.' });
        }
    }
    // --- Fim Validação Membro ---

    // --- Validação DepartmentIds (se fornecido) ---
    let validDepartmentIds = null; // null indica que não foi fornecido e não deve ser alterado
    if (departmentIds !== undefined) { 
        if (!Array.isArray(departmentIds)) {
             return res.status(400).json({ message: 'departmentIds deve ser um array.' });
        }
        // Valida e filtra IDs numéricos. Array vazio é válido (para remover de todos os depts)
        validDepartmentIds = departmentIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        // if (validDepartmentIds.length !== departmentIds.length) { // Opcional: Erro se houver IDs inválidos }
    }
    // --- Fim Validação Departamentos ---

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Atualiza dados básicos do membro (se houver)
        const fieldsToUpdate = {};
        const paramsForUpdate = [];
        let updateMembroQuery = false;

        if (nome_completo !== undefined) { 
            fieldsToUpdate.nome_completo = nome_completo; 
            paramsForUpdate.push(nome_completo);
            updateMembroQuery = true; 
        }
        if (data_nascimento !== undefined) { 
            fieldsToUpdate.data_nascimento = data_nascimento; 
            paramsForUpdate.push(data_nascimento);
            updateMembroQuery = true; 
        }
        if (telefone !== undefined) { 
            fieldsToUpdate.telefone = telefone; 
            paramsForUpdate.push(telefone);
            updateMembroQuery = true; 
        }
        if (celula_id !== undefined) { 
            fieldsToUpdate.celula_id = celula_id; // celula_id já foi validado (pode ser null)
            paramsForUpdate.push(celula_id);
            updateMembroQuery = true; 
        }

        let updateResult;
        if (updateMembroQuery) {
            const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
            paramsForUpdate.push(membroId); // Adiciona o ID para o WHERE
            
            [updateResult] = await connection.query(
                `UPDATE Membros SET ${setClauses} WHERE id = ?`,
                paramsForUpdate
            );

            // Verifica se o membro realmente existia antes de continuar
            if (updateResult.affectedRows === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: 'Membro não encontrado.' });
            }
        }
        
        // 2. Atualiza vínculos com departamentos (se departmentIds foi fornecido)
        if (validDepartmentIds !== null) {
            // 2a. Deleta vínculos antigos
            await connection.query('DELETE FROM Membro_Departamento WHERE membro_id = ?', [membroId]);
            
            // 2b. Insere novos vínculos (se houver)
            if (validDepartmentIds.length > 0) {
                const valuesToInsert = validDepartmentIds.map(deptId => [membroId, deptId]);
                await connection.query('INSERT INTO Membro_Departamento (membro_id, departamento_id) VALUES ?', [valuesToInsert]);
            }
             // Se a query de UPDATE não afetou linhas (pq só alteramos depts), checa se o membro existe
            if (updateResult.affectedRows === 0) {
                const [memberExists] = await connection.query('SELECT 1 FROM Membros WHERE id = ?', [membroId]);
                if (memberExists.length === 0) {
                     await connection.rollback();
                     connection.release();
                     return res.status(404).json({ message: 'Membro não encontrado para atualizar departamentos.' });
                }
            }
        }

        await connection.commit();
        connection.release();

        res.json({ message: 'Membro atualizado com sucesso!' });

    } catch (error) {
        console.error(`Erro ao atualizar membro ${membroId}:`, error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
         // Tratar erro de FK se celula_id ou algum departmentId for inválido
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'ID da Célula ou de um Departamento fornecido é inválido.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar membro.' });
    }
};

// Excluir um membro
exports.deleteMembro = async (req, res) => {
    const { id } = req.params;
    const membroId = parseInt(id, 10);

     if (isNaN(membroId)) {
        return res.status(400).json({ message: 'ID inválido.' });
    }

    let connection;
    try {
        connection = await pool.getConnection(); // Pega uma conexão do pool para transação
        await connection.beginTransaction(); // Inicia a transação

        // 1. Excluir vínculos na tabela Membro_Departamento
        await connection.query('DELETE FROM Membro_Departamento WHERE membro_id = ?', [membroId]);

        // 2. Excluir o membro da tabela Membros
        const [result] = await connection.query('DELETE FROM Membros WHERE id = ?', [membroId]);

        if (result.affectedRows === 0) {
            // Se o membro não foi encontrado, desfaz a transação (embora nada tenha sido feito em Membro_Departamento)
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: 'Membro não encontrado.' });
        }

        // Se tudo deu certo, confirma a transação
        await connection.commit();
        connection.release(); // Libera a conexão de volta para o pool
        
        res.status(200).json({ message: 'Membro excluído com sucesso!' }); 

    } catch (error) {
        console.error(`Erro ao excluir membro ${membroId}:`, error);
        // Se ocorreu um erro, desfaz a transação
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir membro.' });
    }
};

// Adicionar futuramente: getAllMembros, getMembroById, updateMembro, deleteMembro 