const pool = require('../config/db');

/**
 * Busca contagens totais de diferentes entidades no banco de dados.
 */
/*
const getSummaryCounts = async (req, res) => {
    try {
        // Obter a contagem de membros
        const [membrosResult] = await pool.query('SELECT COUNT(*) as totalMembros FROM Membros');
        const totalMembros = membrosResult[0].totalMembros;

        // Obter a contagem de departamentos
        const [departamentosResult] = await pool.query('SELECT COUNT(*) as totalDepartamentos FROM Departamentos');
        const totalDepartamentos = departamentosResult[0].totalDepartamentos;

        // Obter a contagem de células (se existir a tabela Celulas)
        let totalCelulas = 0;
        try {
            const [celulasResult] = await pool.query('SELECT COUNT(*) as totalCelulas FROM Celulas');
            totalCelulas = celulasResult[0].totalCelulas;
        } catch (error) {
            // Ignora o erro se a tabela Celulas não existir ou houver outro problema
            console.warn("Aviso: Não foi possível buscar contagem de Células.", error.message);
        }

        // Obter a contagem de usuários
        const [usuariosResult] = await pool.query('SELECT COUNT(*) as totalUsuarios FROM users');
        const totalUsuarios = usuariosResult[0].totalUsuarios;

        res.json({
            totalMembros,
            totalDepartamentos,
            totalCelulas,
            totalUsuarios
        });

    } catch (error) {
        console.error('Erro ao buscar contagens de resumo:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar resumo.' });
    }
};
*/

// Função para obter os totais para o dashboard
const getSummary = async (req, res) => {
  console.log('[SummaryController] Buscando dados de resumo para o dashboard...');
  try {
    // Executa todas as contagens em paralelo para eficiência
    const [memberResults, departmentResults, cellResults, userResults] = await Promise.all([
      pool.query('SELECT COUNT(*) as totalMembros FROM Membros'),
      pool.query('SELECT COUNT(*) as totalDepartamentos FROM Departamentos'),
      pool.query('SELECT COUNT(*) as totalCelulas FROM Celulas'),
      pool.query('SELECT COUNT(*) as totalUsuarios FROM users')
    ]);

    // Extrai os resultados
    const summaryData = {
      totalMembros: memberResults[0][0].totalMembros || 0,
      totalDepartamentos: departmentResults[0][0].totalDepartamentos || 0,
      totalCelulas: cellResults[0][0].totalCelulas || 0,
      totalUsuarios: userResults[0][0].totalUsuarios || 0,
    };

    console.log('[SummaryController] Dados de resumo obtidos:', summaryData);
    res.status(200).json(summaryData);

  } catch (error) {
    console.error('[SummaryController] Erro ao buscar dados de resumo:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar resumo do dashboard.' });
  }
};

module.exports = {
    getSummary,
}; 