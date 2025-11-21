// Authentication Module with SHA-256 (SheetDB API)
// ================================================

// SheetDB API for Users - NOME SEM ACENTO
// SheetDB API for Users - NOME SEM ACENTO
const USERS_API = 'https://sheetdb.io/api/v1/eqj0lnjk4yht0?sheet=usuarios';

// SHA-256 Hash Function (secure password hashing)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Check if user is already logged in
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('loggistock_user') || 'null');

    if (user && user.email) {
        window.location.href = 'index.html';
        return true;
    }
    return false;
}

// Login function
async function login(email, password) {
    try {
        console.log('🔐 Tentando login com:', email);

        // Hash password with SHA-256
        const hashedPassword = await sha256(password);
        console.log('✅ Hash gerado');

        // Fetch users from SheetDB
        console.log('📡 Buscando usuários da planilha "usuarios"...');
        const response = await fetch(USERS_API);

        console.log('📊 Status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro da API:', errorText);
            throw new Error(`Erro ao conectar com o servidor (${response.status}). Verifique se a aba "usuarios" existe na planilha.`);
        }

        const data = await response.json();
        console.log('📦 Dados recebidos:', data);

        // Handle different response formats
        let users = [];
        if (Array.isArray(data)) {
            users = data;
        } else if (data && typeof data === 'object') {
            users = Object.values(data).flat();
        }

        console.log('👥 Total de usuários:', users.length);

        if (!Array.isArray(users) || users.length === 0) {
            throw new Error('Nenhum usuário cadastrado. Faça seu cadastro primeiro.');
        }

        // Find user by email
        const user = users.find(u => {
            const userEmail = u.email || u.Email || '';
            const isActive = (u.ativo === 'sim' || u.ativo === 'Sim' || u.Ativo === 'Sim' || u.ativo === true);
            return userEmail.toLowerCase() === email.toLowerCase() && isActive;
        });

        if (!user) {
            console.error('❌ Usuário não encontrado');
            throw new Error('Email não encontrado ou usuário inativo.');
        }

        console.log('✅ Usuário encontrado:', user.nome || user.Nome);

        // Verify password (flexible field names)
        const storedHash = user.senha || user.Senha || user['senha_hash'] || user['Senha (Hash)'];

        if (storedHash !== hashedPassword) {
            console.error('❌ Senha incorreta');
            throw new Error('Senha incorreta. Tente novamente.');
        }

        console.log('✅ Senha correta!');

        // Create session
        const session = {
            id: user.id || user.ID || 1,
            nome: user.nome || user.Nome || 'Usuário',
            email: user.email || user.Email,
            cargo: user.cargo || user.Cargo || 'Operador',
            loginTime: new Date().toISOString()
        };

        localStorage.setItem('loggistock_user', JSON.stringify(session));

        console.log('🎉 Login bem-sucedido! Redirecionando...');
        window.location.href = 'index.html';

    } catch (error) {
        console.error('💥 ERRO NO LOGIN:', error);
        throw error;
    }
}

// Register new user (auto-insert to spreadsheet)
async function registerUser(nome, email, password) {
    try {
        console.log('📝 Registrando novo usuário...');
        console.log('Nome:', nome);
        console.log('Email:', email);

        // Check if email already exists
        console.log('🔍 Verificando emails existentes...');
        const response = await fetch(USERS_API);

        console.log('📊 Status:', response.status, response.statusText);

        let users = [];

        if (response.ok) {
            const data = await response.json();

            if (Array.isArray(data)) {
                users = data;
            } else if (data && typeof data === 'object') {
                users = Object.values(data).flat();
            }

            const emailExists = users.some(u => {
                const userEmail = (u.email || u.Email || '').toLowerCase();
                return userEmail === email.toLowerCase();
            });

            if (emailExists) {
                console.error('❌ Email já cadastrado');
                throw new Error('Este email já está cadastrado. Faça login.');
            }
        }

        // Generate secure hash
        console.log('🔐 Gerando hash SHA-256...');
        const hashedPassword = await sha256(password);

        // Get next ID
        const maxId = users.length > 0
            ? Math.max(...users.map(u => parseInt(u.id || u.ID) || 0))
            : 0;

        const nextId = maxId + 1;
        console.log('🆔 Próximo ID:', nextId);

        // Create new user (ALWAYS as Operador)
        // COLUNAS: id, nome, email, senha, cargo, data_criacao, ativo
        const newUser = {
            id: nextId,
            nome: nome,
            email: email,
            senha: hashedPassword,
            cargo: 'Operador',
            data_criacao: new Date().toLocaleDateString('pt-BR'),
            ativo: 'sim'
        };

        console.log('📤 Enviando para planilha:', { ...newUser, senha: '***' });

        // Insert to SheetDB
        const createResponse = await fetch(USERS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ data: [newUser] })
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('❌ Erro ao criar usuário:', errorText);
            throw new Error(`Erro ao cadastrar usuário (${createResponse.status}). Verifique se a aba "usuarios" existe.`);
        }

        console.log('🎉 Usuário cadastrado com sucesso!');
        return true;

    } catch (error) {
        console.error('💥 ERRO NO CADASTRO:', error);
        throw error;
    }
}

// Logout function
function logout() {
    console.log('👋 Fazendo logout...');
    localStorage.removeItem('loggistock_user');
    window.location.href = 'login.html';
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('loggistock_user') || 'null');
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.cargo === 'Administrador';
}

// Initialize login page
if (window.location.pathname.includes('login.html')) {
    console.log('📄 Página de login carregada');

    if (checkAuth()) {
        // Will redirect
    }

    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        errorDiv.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Entrando...';

        try {
            await login(email, password);
        } catch (error) {
            errorText.textContent = error.message || 'Erro ao fazer login.';
            errorDiv.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-2"></i>Entrar';
        }
    });
}

// Initialize register page
if (window.location.pathname.includes('criar-usuario.html')) {
    console.log('📄 Página de cadastro carregada');

    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const errorDiv = document.getElementById('register-error');
        const errorText = document.getElementById('register-error-text');
        const successDiv = document.getElementById('register-success');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');

        if (password.length < 6) {
            errorText.textContent = 'A senha deve ter no mínimo 6 caracteres';
            errorDiv.classList.remove('hidden');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Cadastrando...';

        try {
            await registerUser(nome, email, password);

            successDiv.classList.remove('hidden');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            errorText.textContent = error.message || 'Erro ao cadastrar.';
            errorDiv.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-user-plus mr-2"></i>Criar Conta';
        }
    });
}

// Initialize main app - check authentication
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    window.addEventListener('DOMContentLoaded', () => {
        const user = getCurrentUser();

        if (!user) {
            console.log('❌ Usuário não autenticado');
            window.location.href = 'login.html';
            return;
        }

        console.log('✅ Usuário logado:', user.nome, `(${user.cargo})`);
    });
}

// Test API function
window.testarAPI = async function () {
    console.log('🧪 TESTE DA API');
    console.log('URL:', USERS_API);

    try {
        const response = await fetch(USERS_API);
        console.log('Status:', response.status, response.statusText);

        if (response.ok) {
            const data = await response.json();
            console.log('Dados:', data);
            console.log('✅ API funcionando!');
        } else {
            const errorText = await response.text();
            console.error('❌ Erro:', errorText);
        }
    } catch (error) {
        console.error('💥 Erro:', error);
    }
};

console.log('🔐 Auth SheetDB carregado');
console.log('📋 Aba: "usuarios"');

// Expose functions to window
window.getCurrentUser = getCurrentUser;
window.login = login;
window.logout = logout;
window.registerUser = registerUser;
