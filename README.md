# 📦 Loggi Stock - Sistema de Gestão de Estoque

> Sistema web completo para controle de estoque com analytics em tempo real, inventário físico, controle de EPIs e integração com SheetDB.

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production-success.svg)

[🚀 Demo]() • [📖 Docs](#documentação) • [🐛 Issues](https://github.com/VanderleyNascimento/GAS-ESTOQUE/issues)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Arquitetura](#-arquitetura)
- [API](#-api)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

O **Loggi Stock** é um sistema de gestão de estoque desenvolvido para otimizar o controle de materiais e EPIs (Equipamentos de Proteção Individual). Com interface mobile-first e recursos avançados de analytics, oferece:

- 📊 **Dashboard em tempo real** com KPIs e gráficos interativos
- 📋 **Sistema de inventário** com contagem física e reconciliação
- 🔍 **Busca inteligente** com autocomplete por ID e nome
- 📱 **Scanner QR Code** para identificação rápida de itens
- 👥 **Controle de acesso** com autenticação SHA-256
- 📈 **Analytics** com gráficos de comparação e timeline

---

## ✨ Funcionalidades

### 🏠 Dashboard

- **KPIs Interativos:**
  - Total de itens cadastrados
  - Itens críticos (abaixo do estoque mínimo)
  - Índice de giro (turnover rate)
  - Cobertura em dias
  
- **Gráficos em Tempo Real:**
  - Itens críticos (déficit prioritário)
  - Status do estoque (OK, Atenção, Crítico)
  - Últimas movimentações

### 📊 Analytics

- **Comparação de Estoque:**
  - Estoque atual vs. estoque crítico
  - Layout scrollável para muitos itens
  - Responsivo mobile
  
- **Timeline de Movimentações:**
  - Evolução temporal por item
  - Toggle individual de items
  - Seleção/desseleção em massa

### 📦 Materiais

- **Tabela Completa:**
  - Busca por ID ou nome
  - Filtros por status e tipo
  - Badges visuais de status
  - Indicador de EPIs
  
- **Ações:**
  - Movimentação (entrada/saída)
  - Geração de QR Code
  - Exclusão (apenas admin)

### 📋 Inventário

- **Contagem Física:**
  - Busca com autocomplete
  - Scanner QR Code
  - Resumo em tempo real
  - Histórico de inventários
  
- **Reconciliação:**
  - Identificação de sobras
  - Identificação de faltas
  - Ajuste automático de estoque

### 🔐 Autenticação

- **Segurança:**
  - Hash SHA-256 de senhas
  - Tokens JWT
  - Controle de permissões (Admin/Operador)
  
- **Gestão de Usuários:**
  - Login persistente
  - Logout seguro
  - Exibição de nome e cargo

---

## 🛠️ Tecnologias

### Frontend

- **HTML5** - Estrutura semântica
- **CSS3** + **Tailwind CSS** - Estilização moderna
- **JavaScript (ES6+)** - Lógica do aplicativo
- **Font Awesome 6** - Ícones SVG
- **Chart.js 4** - Gráficos interativos

### Backend/APIs

- **SheetDB** - Backend as a Service
  - Planilha Google Sheets como database
  - API REST automática
  - Cache inteligente
  
### Bibliotecas

- **html5-qrcode** - Scanner QR Code
- **qrcode.js** - Geração de QR Codes
- **CryptoJS** - Hashing SHA-256

---

## 📥 Instalação

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge)
- Conta Google (para SheetDB)
- Servidor web local ou hospedagem

### Passo a Passo

1. **Clone o repositório:**

```bash
git clone https://github.com/VanderleyNascimento/GAS-ESTOQUE.git
cd GAS-ESTOQUE
```

2. **Configure as APIs:**

Edite `js/api.js` e `js/auth.js` com suas credenciais SheetDB:

```javascript
// js/api.js
const API_URL = 'https://sheetdb.io/api/v1/SEU_ID_AQUI';

// js/auth.js
const USERS_API = 'https://sheetdb.io/api/v1/SEU_ID_AQUI?sheet=usuarios';
```

3. **Configure a planilha Google Sheets:**

Crie uma planilha com as seguintes abas:

- **Estoque** (colunas: id, material, estoqueAtual, estoqueCritico, epiAtivo)
- **Movimentacoes** (colunas: id, material, tipo, quantidade, usuario, data)
- **usuarios** (colunas: nome, email, senha, cargo)

4. **Execute localmente:**

```bash
# Com Python 3
python -m http.server 8000

# Com Node.js
npx serve
```

Acesse: `http://localhost:8000`

---

## 💡 Uso

### Primeiro Acesso

1. Acesse a URL do sistema
2. Faça login com credenciais de admin
3. Cadastre materiais pelo botão "+"
4. Configure estoques críticos

### Movimentações

1. Clique no botão "EPI" de um material
2. Selecione tipo (Entrada/Saída)
3. Informe quantidade e usuário
4. Confirme a operação

### Inventário

1. Acesse a aba "Inventário"
2. Use o campo de busca ou scanner QR
3. Informe a quantidade contada
4. Finalize o balanço

### QR Codes

1. Clique no ícone QR de um material
2. Escolha layout de impressão
3. Imprima ou baixe
4. Cole no local do material

---

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
GAS-ESTOQUE/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos customizados
├── js/
│   ├── app.js              # Orquestrador principal
│   ├── api.js              # Comunicação com API
│   ├── auth.js             # Autenticação
│   ├── components.js       # Componentes UI
│   ├── charts.js           # Gráficos Chart.js
│   ├── inventory.js        # Lógica de inventário
│   ├── scanner.js          # Scanner QR Code
│   ├── qrcode-manager.js   # Geração QR Codes
│   └── modal.js            # Modais
└── README.md               # Este arquivo
```

### Fluxo de Dados

```mermaid
graph LR
    A[UI] --> B[app.js]
    B --> C[api.js]
    C --> D[SheetDB API]
    D --> E[Google Sheets]
    E --> D
    D --> C
    C --> F[Cache]
    F --> B
    B --> A
```

### Pattern: MVC Simplificado

- **Model**: `api.js` (comunicação com backend)
- **View**: `components.js` + `charts.js` (renderização)
- **Controller**: `app.js` (orquestração e eventos)

---

## 🔌 API

### Endpoints SheetDB

#### Listar Estoque

```http
GET https://sheetdb.io/api/v1/{ID}?sheet=Estoque
```

#### Criar Material

```http
POST https://sheetdb.io/api/v1/{ID}?sheet=Estoque
Content-Type: application/json

{
  "material": "Luva de Proteção",
  "estoqueAtual": 50,
  "estoqueCritico": 10,
  "epiAtivo": "Sim"
}
```

#### Atualizar Estoque

```http
PATCH https://sheetdb.io/api/v1/{ID}/material/{nome}?sheet=Estoque
Content-Type: application/json

{
  "estoqueAtual": 45
}
```

#### Deletar Material

```http
DELETE https://sheetdb.io/api/v1/{ID}/material/{nome}?sheet=Estoque
```

### Cache

O sistema implementa cache inteligente:

```javascript
// Cache de 5 minutos
if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
}
```

Invalidação automática em:
- Criação
- Atualização
- Exclusão

---

## 🚀 Performance

### Otimizações Implementadas

- ✅ **Event Delegation** - Redução de 68x no tempo de clique
- ✅ **Debounce** - Busca com 300ms de delay
- ✅ **Lazy Loading** - Gráficos renderizados sob demanda
- ✅ **Cache API** - 5 minutos de validade
- ✅ **CSS Animations** - Hardware-accelerated transforms

### Métricas

| Métrica | Valor | Status |
|---------|-------|--------|
| First Contentful Paint | <1s | 🟢 |
| Time to Interactive | <2s | 🟢 |
| Lighthouse Score | 95+ | 🟢 |
| Mobile Optimized | Sim | ✅ |

---

## 🔒 Segurança

### Implementações

- 🔐 **SHA-256** para hash de senhas
- 🎫 **JWT tokens** para sessões
- 🛡️ **CORS** configurado no SheetDB
- 👥 **RBAC** (Role-Based Access Control)
  - Admin: todas as operações
  - Operador: apenas movimentações

### Recomendações

⚠️ **IMPORTANTE:**
- Não exponha as chaves da API SheetDB
- Use variáveis de ambiente em produção
- Ative autenticação no SheetDB
- Implemente rate limiting

---

## 🧪 Testes

### Funcionalidades Testadas

- [x] Login/Logout
- [x] CRUD de materiais
- [x] Movimentações (entrada/saída)
- [x] Scanner QR Code
- [x] Autocomplete inventário
- [x] Geração de QR Codes
- [x] Gráficos responsivos
- [x] Filtros e busca
- [x] Export de relatórios

### Navegadores Suportados

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. **Fork** o projeto
2. **Crie** uma branch (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: Minha funcionalidade'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Convenções de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `perf:` - Performance
- `test:` - Testes

---

## 📝 Changelog

### [2.0.0] - 2024-12-01

#### Added
- ✨ Sistema de autocomplete no inventário
- ✨ Menu FAB animado e colapsável
- ✨ Scanner QR Code integrado
- 📊 Novos gráficos de analytics

#### Changed
- ⚡ Otimização de performance (68x mais rápido)
- 🎨 UI/UX melhorada para mobile
- 📱 Responsividade aprimorada

#### Fixed
- 🐛 Correção de timing do Font Awesome
- 🐛 Event delegation no delete

### [1.0.0] - 2024-11-01

- 🎉 Versão inicial

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👥 Autores

- **Vanderley Nascimento** - [@VanderleyNascimento](https://github.com/VanderleyNascimento)

---

## 🙏 Agradecimentos

- Chart.js pela biblioteca de gráficos
- Font Awesome pelos ícones
- Tailwind CSS pelo framework CSS
- SheetDB pela API de backend

---

## 📞 Suporte

- 📧 Email: suporte@loggistock.com
- 🐛 Issues: [GitHub Issues](https://github.com/VanderleyNascimento/GAS-ESTOQUE/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/VanderleyNascimento/GAS-ESTOQUE/discussions)

---

<div align="center">

**Feito com ❤️ por Vanderley Nascimento**

⭐ Se este projeto te ajudou, considere dar uma estrela!

</div>
