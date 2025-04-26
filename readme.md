# Sistema de Gerenciamento IEQ-Membros (React + Node.js + MySQL)

Um sistema web full-stack para gerenciamento de membros, departamentos e células da igreja, com funcionalidades de registro, login, gerenciamento de sessão com JWT, CRUDs e dashboard de resumo.

## Funcionalidades Principais

*   Autenticação de usuários (Login/Logout) com JWT.
*   Registro de usuários (Hashing de senha com **Argon2**).
*   **Registro Temporário de Administrador:** Funcionalidade inicial para criar o primeiro usuário admin via interface (veja seção de configuração).
*   Gerenciamento de Perfil (Visualização de dados, Alteração de senha usando Argon2).
*   Controle de Acesso Baseado em Função (Admin vs User).
*   **Gerenciamento de Usuários (Admin):** Criar, Listar, Atualizar (username, role, **redefinir senha**), Excluir.
*   **Gerenciamento de Membros:** Cadastrar (com seleção de Departamentos e Célula via modal), Listar (com filtros e paginação), Editar (incluindo Departamentos e Célula), Excluir.
*   **Gerenciamento de Departamentos:** Criar, Listar (com contagem de membros), Editar, Excluir, Associar/Desassociar Membros via modal.
*   **Gerenciamento de Células:** Criar, Listar, Editar, Excluir.
*   **Dashboard:** Exibição de resumo (Total de Membros, Departamentos, Células, Usuários - visível para Admin).
*   Notificações de feedback (React Toastify).
*   Interface responsiva com Bootstrap 5 e React Bootstrap.
*   Interface de Login moderna com imagem de fundo.
*   Navbar com tema escuro e menu dropdown para perfil/logout.

## Tecnologias Utilizadas

**Frontend:**

*   React (v18+)
*   Vite
*   JavaScript
*   React Router DOM (v6)
*   Axios
*   React Toastify
*   Bootstrap 5
*   React Bootstrap
*   **React Icons** (substituindo parcialmente react-bootstrap-icons)
*   React IMask (para máscaras de input)

**Backend:**

*   Node.js (v18+)
*   Express
*   mysql2 (Promise wrapper)
*   jsonwebtoken (JWT)
*   **argon2** (para hashing de senha)
*   cors
*   dotenv


**Banco de Dados:**

*   MySQL 8+

## Pré-requisitos

*   Node.js (v18 ou superior) e npm (ou yarn) instalados.
*   Servidor MySQL (v8 ou superior) instalado e rodando (ou conta em serviço como PlanetScale/Railway).
*   Cliente MySQL (Workbench, DBeaver, linha de comando) para executar scripts SQL.

## Instalação e Configuração Local (Desenvolvimento)

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-seu-repositorio>
    cd ieqmembrov1 # Navegue para a pasta principal da aplicação
    ```

2.  **Configure o Banco de Dados:**
    *   Certifique-se que o servidor MySQL está rodando.
    *   Usando seu cliente MySQL, crie o banco de dados (se ainda não existir):
        ```sql
        CREATE DATABASE IF NOT EXISTS ieqmembro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        USE ieqmembro; # Seleciona o banco
        ```
    *   Execute o script para criar as tabelas:
        ```bash
        # Estando na pasta ieqmembrov1/backend
        mysql -u SEU_USUARIO_MYSQL -p ieqmembro < sql/schema.sql
        ```
    *   **Importante:** Ignore o `seed.sql` por enquanto se for usar o Registro de Admin Temporário.

3.  **Configure o Backend:**
    *   Navegue até a pasta do backend: `cd backend`
    *   **CRÍTICO:** Crie o arquivo `.env` (copiando de `.env.example`) e preencha **TODAS** as variáveis de banco de dados (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) e defina um `JWT_SECRET` forte e único.
    *   Instale as dependências: `npm install`.

4.  **Configure o Frontend:**
    *   Navegue até a pasta do frontend: `cd ../frontend`
    *   Instale as dependências: `npm install`.
    *   (Opcional) Se o backend estiver rodando em local diferente de `http://localhost:3001`, crie um arquivo `.env` em `ieqmembrov1/frontend/.env` com a linha `VITE_API_BASE_URL=http://seu-backend-local/api`.

## Como Executar (Desenvolvimento)

1.  **Iniciar o Backend:**
    *   Abra um terminal na pasta `ieqmembrov1/backend`.
    *   Execute: `npm run dev` (ou `npm start`).
    *   O servidor backend deve iniciar na porta definida no `.env` (padrão 3001).

2.  **Iniciar o Frontend:**
    *   Abra **outro** terminal na pasta `ieqmembrov1/frontend`.
    *   Execute: `npm run dev`.
    *   O servidor de desenvolvimento frontend deve iniciar na porta 3000.

3.  **Acessar a Aplicação e Criar Primeiro Admin:**
    *   Abra seu navegador e acesse `http://localhost:3000` (será redirecionado para `/login`).
    *   **Na tela de Login, clique no botão "Registrar como Administrador (Temp)"** na parte inferior.
    *   Preencha o formulário na página `/admin-register` (Nome, Email, Senha) e clique em "Registrar". O email fornecido será usado como `username`.
    *   Você será redirecionado de volta para a tela de Login.
    *   Agora, use o **email** que você acabou de registrar como "Usuário" e a senha definida para fazer login.

**Observação sobre Registro de Admin Temporário:**
*   Esta funcionalidade (`/admin-register`) serve apenas para criar o primeiro usuário administrador facilmente durante o desenvolvimento ou configuração inicial.
*   Para segurança em produção, recomenda-se **desabilitar** esta rota (`app.post('/api/auth/admin-register', ...)` no `backend/src/server.js`) após a criação do primeiro administrador, ou usar um método mais seguro como um script de seed protegido.

## Deploy (Produção)

1.  **Preparar Servidor de Produção:**
    *   Configure um servidor (VPS, Cloud tipo Render) com Node.js e npm.
    *   Configure seu serviço de Banco de Dados (MySQL no PlanetScale, Railway, etc.).
    *   Instale o `pm2` globalmente se for usar VPS: `npm install pm2 -g`.

2.  **Deploy do Banco de Dados:**
    *   Crie o banco de dados `ieqmembro` no serviço de produção.
    *   Execute os scripts `schema.sql` e `seed.sql` (com o hash Argon2 de **produção**) no banco de produção.

3.  **Deploy do Backend (Ex: Render Web Service):**
    *   Conecte seu repositório Git ao Render.
    *   Configure o Build Command: `npm install` (Render instala dependências automaticamente).
    *   Configure o Start Command: `node src/server.js` (ou `npm start`).
    *   Configure as **Environment Variables** no Render:
        *   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` apontando para seu DB de **produção**.
        *   `PORT` (Render geralmente define isso automaticamente, mas verifique).
        *   **`JWT_SECRET`:** Use um segredo **FORTE E ÚNICO** para produção. **NÃO REUSE O DE DEV.**
        *   `FRONTEND_URL_PROD`: A URL completa do seu frontend em produção (ex: `https://seu-frontend.onrender.com`).
        *   `FRONTEND_URL_DEV`: (Opcional, para CORS se ainda testar localmente contra a API de prod).

4.  **Deploy do Frontend (Ex: Render Static Site):**
    *   Conecte seu repositório Git ao Render.
    *   Configure o Root Directory: `frontend` (se o seu `package.json` do frontend está nessa subpasta).
    *   Configure o Build Command: `npm install && npm run build`.
    *   Configure o Publish Directory: `frontend/dist`.
    *   Configure as **Environment Variables** no Render (para o build):
        *   `VITE_API_BASE_URL`: A URL completa da sua API de **produção** (ex: `https://sua-api.onrender.com/api`).
    *   **Regras de Reesrita/Redirecionamento (Rewrite Rules):** Adicione uma regra para lidar com o roteamento SPA:
        *   Source Path: `/*`
        *   Destination Path: `/index.html`
        *   Action: `Rewrite`

## Estrutura do Projeto

.
├── .git/             # (Oculto)
├── .gitignore
├── backend/
│   ├── node_modules/   # (Ignorado pelo .gitignore)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   │   └── server.js
│   ├── sql/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── .env.example
│   ├── .env              # (Ignorado pelo .gitignore)
│   └── package.json
│   └── ...
└── frontend/
    ├── node_modules/   # (Ignorado pelo .gitignore)
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   ├── App.jsx
    │   └── main.jsx
    ├── .gitignore
    ├── index.html
    ├── package.json
    └── vite.config.js
    └── ...
└── README.md

## Atualizando a Aplicação na VPS (Deploy Manual)

Este projeto está configurado para deploy manual na VPS. Para aplicar atualizações feitas localmente e enviadas para o GitHub, siga estes passos:

1.  **Desenvolvimento Local:** Faça as alterações desejadas no código (frontend ou backend).
2.  **Commit & Push:** Use o GitHub Desktop (ou `git` na linha de comando) para fazer o commit das suas alterações e enviá-las (push) para a branch principal (`main`) do seu repositório no GitHub.
3.  **Conectar à VPS:** Use SSH para conectar ao seu servidor VPS.
    ```bash
    ssh seu_usuario@IP_DA_SUA_VPS
    ```
4.  **Navegar para o Diretório:** Vá para a pasta raiz do projeto.
    ```bash
    cd /var/www/ieqmembrov1
    ```
5.  **Buscar Atualizações do GitHub:** Baixe as informações mais recentes do repositório remoto sem aplicá-las ainda.
    ```bash
    git fetch origin
    ```
6.  **Aplicar Atualizações (Método Seguro - Arquivo Específico):**
    *   Este é o método mais seguro para evitar sobrescrever configurações específicas da VPS (como `backend/.env` ou modificações em `backend/src/server.js`).
    *   Use `git checkout` para buscar a versão mais recente de **arquivos específicos** da branch principal do GitHub e sobrescrever a versão local na VPS.
    *   **Exemplo para um arquivo do frontend:**
        ```bash
        # Substitua 'main' se sua branch for outra
        # Substitua pelo caminho real do arquivo modificado
        git checkout origin/main -- frontend/src/components/NomeComponente.jsx
        ```
    *   **Exemplo para um arquivo do backend:**
        ```bash
        # Substitua 'main' se sua branch for outra
        # Substitua pelo caminho real do arquivo modificado
        git checkout origin/main -- backend/src/controllers/AlgumController.js
        ```
    *   **Observação:** Você pode especificar múltiplos arquivos no mesmo comando `git checkout`.

7.  **Aplicar Atualizações (Método Alternativo - `git pull` - CUIDADO!):**
    *   O comando `git pull origin main` tenta baixar e mesclar *todas* as alterações da branch `main`.
    *   **RISCO:** Isso **pode sobrescrever** alterações que você fez manualmente na VPS (ex: configurações em `server.js`) se houver conflitos e você não souber como resolvê-los corretamente. **NÃO USE** se você modificou arquivos de configuração importantes diretamente na VPS sem commitar e fazer push dessas mudanças (o que geralmente não é desejável para arquivos de configuração de produção).
    *   **Use com extrema cautela.** Se usar, verifique o status (`git status`) antes e depois para entender o que foi alterado.

8.  **Reinstalar Dependências (Se Necessário):**
    *   **Se você alterou `backend/package.json`:**
        ```bash
        cd backend
        npm install --production
        cd ..
        ```
    *   **Se você alterou `frontend/package.json`:**
        ```bash
        cd frontend
        npm install 
        cd ..
        ```

9.  **Reconstruir o Frontend (Se código do frontend mudou):**
    ```bash
    cd frontend
    npm run build
    cd ..
    ```

10. **Reiniciar o Backend (Se código do backend mudou):**
    ```bash
    pm2 restart ieqmembro-backend
    ```
    *   Você pode verificar o status com `pm2 list` e os logs com `pm2 logs ieqmembro-backend`.

11. **Limpar Cache (Opcional):** Se as mudanças no frontend não aparecerem imediatamente, tente limpar o cache do seu navegador ou fazer um Hard Refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`).

**Automação (CI/CD):**
Para facilitar futuras atualizações, considere configurar um pipeline de Integração Contínua e Deploy Contínuo (CI/CD) usando ferramentas como GitHub Actions. Isso pode automatizar os passos de fetch, build, e restart após um `git push`.
