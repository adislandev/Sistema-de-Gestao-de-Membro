-- Criação da tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Armazena o hash da senha
    role ENUM('admin', 'member') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criação da tabela de células
CREATE TABLE IF NOT EXISTS Celulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    lider_id INT NULL, -- Permitindo NULL temporariamente se o líder for de outra tabela ou opcional
    -- Se lider_id referenciar a tabela users:
    -- FOREIGN KEY (lider_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE, 
    -- Se lider_id referenciar a tabela Membros (precisa ser criada antes se for o caso):
    -- FOREIGN KEY (lider_id) REFERENCES Membros(id) ON DELETE SET NULL ON UPDATE CASCADE, 
    bairro VARCHAR(100) NULL,
    rua VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criação da tabela de membros da igreja
CREATE TABLE IF NOT EXISTS Membros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE NULL,
    telefone VARCHAR(20) NULL,
    celula_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (celula_id) REFERENCES Celulas(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Ajuste a FK de Celulas.lider_id se referenciar Membros)
-- ALTER TABLE Celulas ADD CONSTRAINT fk_celula_lider_membro FOREIGN KEY (lider_id) REFERENCES Membros(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Criação da tabela de departamentos
CREATE TABLE IF NOT EXISTS Departamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criação da tabela de associação entre membros e departamentos (Muitos-para-Muitos)
CREATE TABLE IF NOT EXISTS Membro_Departamento (
    membro_id INT NOT NULL,
    departamento_id INT NOT NULL,
    PRIMARY KEY (membro_id, departamento_id),
    FOREIGN KEY (membro_id) REFERENCES Membros(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (departamento_id) REFERENCES Departamentos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 