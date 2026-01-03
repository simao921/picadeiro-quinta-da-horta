==============================================
CONFIGURAÇÃO .ENV PARA EXPORTAR O SITE
==============================================

Para rodar este site no seu VSCode localmente, crie um arquivo .env na raiz do projeto com:

# Base44 App Configuration
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://picadeiro-quinta-da-horta.base44.app

# Google OAuth (se usar autenticação Google)
GOOGLE_OAUTH_CLIENT_ID=seu_google_client_id_aqui
GOOGLE_OAUTH_CLIENT_SECRET=seu_google_client_secret_aqui

==============================================
PASSOS PARA EXPORTAR O SITE COMPLETO:
==============================================

1. Criar projeto Vite React localmente:
   npm create vite@latest picadeiro-site -- --template react
   cd picadeiro-site

2. Instalar dependências necessárias:
   npm install @base44/sdk@^0.8.3
   npm install @tanstack/react-query react-router-dom
   npm install lucide-react framer-motion
   npm install date-fns lodash
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
   npm install @radix-ui/react-select @radix-ui/react-tabs
   npm install class-variance-authority clsx tailwind-merge
   npm install tailwindcss postcss autoprefixer
   npm install sonner react-hook-form

3. Copiar todos os arquivos:
   - Copiar pages/ para src/pages/
   - Copiar components/ para src/components/
   - Copiar Layout.js para src/
   - Copiar globals.css para src/
   - Copiar entities/ (schemas) para documentação

4. Criar arquivo .env na raiz com as variáveis acima

5. Configurar Tailwind CSS:
   npx tailwindcss init -p

6. Ajustar imports:
   - Substituir @/api/base44Client pelos imports corretos
   - Configurar rotas no main.jsx
   - Configurar @/ alias no vite.config.js

7. Rodar localmente:
   npm run dev

==============================================
DADOS DA APLICAÇÃO BASE44:
==============================================

APP ID: cbef744a8545c389ef439ea6
URL Base: https://picadeiro-quinta-da-horta.base44.app

Secret configurado:
- google_oauth_client_secret (configurado no dashboard Base44)

==============================================
NOTAS IMPORTANTES:
==============================================

- Backend functions continuarão a rodar no Base44
- A base de dados continua no Base44
- Autenticação continua gerenciada pelo Base44
- O frontend local fará chamadas para o backend Base44

Para exportação completa independente do Base44, seria necessário:
- Implementar backend próprio
- Configurar base de dados própria
- Implementar sistema de autenticação próprio