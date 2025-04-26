const pool = require('../config/db'); // Importa o pool de conexões

// Listar todas as células com informações agregadas
exports.getAllCelulas = async (req, res) => {
    try {
        const query = `
            SELECT 
                C.id, 
                C.nome, 
                C.bairro, 
                C.rua,
                C.lider_id,
                Lider.nome_completo AS lider_nome,
                COUNT(DISTINCT Membro.id) AS total_membros
            FROM Celulas AS C
            LEFT JOIN Membros AS Lider ON C.lider_id = Lider.id
            LEFT JOIN Membros AS Membro ON Membro.celula_id = C.id
            GROUP BY C.id
            ORDER BY C.nome ASC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar células:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar células.' });
    }
};

// Criar uma nova célula
exports.createCelula = async (req, res) => {
    let { nome, lider_id, bairro, rua } = req.body;

    // Validação
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(400).json({ message: 'Nome da célula é obrigatório.' });
    }
    nome = nome.trim();
    if (nome.length > 100) {
        return res.status(400).json({ message: 'Nome da célula não pode exceder 100 caracteres.' });
    }
    if (lider_id === undefined || lider_id === null || lider_id === '') {
         return res.status(400).json({ message: 'Líder é obrigatório.' });
    }
    lider_id = parseInt(lider_id, 10);
    if (isNaN(lider_id)) {
        return res.status(400).json({ message: 'ID do Líder inválido.' });
    }
    bairro = bairro?.trim() || null;
    rua = rua?.trim() || null;
    if (bairro && bairro.length > 100) return res.status(400).json({ message: 'Bairro não pode exceder 100 caracteres.'});
    if (rua && rua.length > 100) return res.status(400).json({ message: 'Rua não pode exceder 100 caracteres.'});

    try {
        // Verificar se o líder já lidera outra célula
        const [existingLeader] = await pool.query('SELECT id FROM Celulas WHERE lider_id = ?', [lider_id]);
        if (existingLeader.length > 0) {
            return res.status(409).json({ message: 'Este membro já é líder de outra célula.' });
        }

        // Verificar se o nome da célula já existe (UNIQUE constraint cuida disso, mas podemos checar antes)
        const [existingName] = await pool.query('SELECT id FROM Celulas WHERE nome = ?', [nome]);
        if (existingName.length > 0) {
             return res.status(409).json({ message: 'Já existe uma célula com este nome.' });
        }

        // Inserir nova célula
        const [result] = await pool.query(
            'INSERT INTO Celulas (nome, lider_id, bairro, rua) VALUES (?, ?, ?, ?)', 
            [nome, lider_id, bairro, rua]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            nome, lider_id, bairro, rua, 
            message: 'Célula criada com sucesso!' 
        });

    } catch (error) {
        // Tratar erro de chave estrangeira (lider_id não existe em Membros)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Membro líder selecionado não existe.' });
        }
        // Tratar erro de nome duplicado (se não checamos antes)
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Já existe uma célula com este nome.' });
        }
        console.error('Erro ao criar célula:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar célula.' });
    }
};

// Atualizar uma célula existente
exports.updateCelula = async (req, res) => {
    const { id } = req.params;
    let { nome, lider_id, bairro, rua } = req.body;
    const celulaId = parseInt(id, 10);

    if (isNaN(celulaId)) {
        return res.status(400).json({ message: 'ID da Célula inválido.' });
    }

    // Validação dos campos fornecidos
    const fieldsToUpdate = {};
    if (nome !== undefined) {
        if (typeof nome !== 'string' || nome.trim().length === 0) return res.status(400).json({ message: 'Nome não pode ser vazio.' });
        nome = nome.trim();
        if (nome.length > 100) return res.status(400).json({ message: 'Nome não pode exceder 100 caracteres.' });
        fieldsToUpdate.nome = nome;
    }
     if (lider_id !== undefined) {
        if (lider_id === null || lider_id === '') return res.status(400).json({ message: 'Líder não pode ser removido (apenas trocado).' }); // Ou permitir desvincular?
        lider_id = parseInt(lider_id, 10);
        if (isNaN(lider_id)) return res.status(400).json({ message: 'ID do Líder inválido.' });
        fieldsToUpdate.lider_id = lider_id;
    }
     if (bairro !== undefined) {
        bairro = bairro?.trim() || null;
        if (bairro && bairro.length > 100) return res.status(400).json({ message: 'Bairro não pode exceder 100 caracteres.'});
        fieldsToUpdate.bairro = bairro;
    }
    if (rua !== undefined) {
        rua = rua?.trim() || null;
        if (rua && rua.length > 100) return res.status(400).json({ message: 'Rua não pode exceder 100 caracteres.'});
        fieldsToUpdate.rua = rua;
    }
    
    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ message: 'Nenhum campo fornecido para atualização.' });
    }

    try {
         // Se o líder está sendo atualizado, verificar se o novo líder já lidera outra célula
        if (fieldsToUpdate.lider_id !== undefined) {
            const [existingLeader] = await pool.query(
                'SELECT id FROM Celulas WHERE lider_id = ? AND id != ?', 
                [fieldsToUpdate.lider_id, celulaId]
            );
            if (existingLeader.length > 0) {
                return res.status(409).json({ message: 'Este membro já é líder de outra célula.' });
            }
        }

        // Se o nome está sendo atualizado, verificar duplicação (opcional, DB já faz)
        if (fieldsToUpdate.nome !== undefined) {
            const [existingName] = await pool.query(
                'SELECT id FROM Celulas WHERE nome = ? AND id != ?', 
                [fieldsToUpdate.nome, celulaId]
            );
            if (existingName.length > 0) {
                 return res.status(409).json({ message: 'Já existe outra célula com este nome.' });
            }
        }

        // Atualizar célula
        const [result] = await pool.query('UPDATE Celulas SET ? WHERE id = ?', [fieldsToUpdate, celulaId]);
        
        if (result.affectedRows === 0) {
             return res.status(404).json({ message: 'Célula não encontrada.' });
        }
        
        res.json({ message: 'Célula atualizada com sucesso!' });

    } catch (error) {
        // Tratar erro de chave estrangeira (lider_id não existe em Membros)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Membro líder selecionado não existe.' });
        }
        // Tratar erro de nome duplicado (se não checamos antes)
        if (error.code === 'ER_DUP_ENTRY' && fieldsToUpdate.nome !== undefined) {
             return res.status(409).json({ message: 'Já existe outra célula com este nome.' });
        }
        console.error(`Erro ao atualizar célula ${celulaId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar célula.' });
    }
};

// Excluir uma célula
exports.deleteCelula = async (req, res) => {
    const { id } = req.params;
    const celulaId = parseInt(id, 10);

     if (isNaN(celulaId)) {
        return res.status(400).json({ message: 'ID inválido.' });
    }
    
    try {
        // A FK em Membros tem ON DELETE SET NULL, então basta deletar a célula
        const [result] = await pool.query('DELETE FROM Celulas WHERE id = ?', [celulaId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Célula não encontrada.' });
        }
        
        res.status(200).json({ message: 'Célula excluída com sucesso!' }); 

    } catch (error) {
        console.error(`Erro ao excluir célula ${celulaId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir célula.' });
    }
}; 