// Authentication with Supabase
// =====================================

// SHA-256 Hash Function (secure password hashing)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Register new user (ALWAYS INACTIVE by default)
async function registerUser(nome, email, password) {
    try {
        console.log('📝 Registrando novo usuário...');

        // Check if email already exists
        const { data: existingUsers, error: checkError } = await window.supabaseClient
            .from('usuarios')
            .select('email')
            .eq('email', email.toLowerCase());

        if (checkError) throw checkError;

        if (existingUsers && existingUsers.length > 0) {
            throw new Error('Este email já está cadastrado.');
        }

        // Hash password
        const hashedPassword = await sha256(password);

        // Create user - ALWAYS INACTIVE (ativo = 0)
        const newUser = {
            nome: nome,
            email: email.toLowerCase(),
            senha: hashedPassword,
            cargo: 'Operador',
            ativo: 0  // ← DESATIVADO por padrão!
        };

        const { error: insertError } = await window.supabaseClient
            .from('usuarios')
            .insert([newUser]);

        if (insertError) throw insertError;

        console.log('✅ Usuário criado (DESATIVADO - aguardando aprovação)');
        return true;

    } catch (error) {
        console.error('❌ Erro no cadastro:', error);
        throw error;
    }
}

// Login function
async function login(email, password) {
    try {
        console.log('🔐 Tentando login:', email);

        // Hash password
        const hashedPassword = await sha256(password);

        // Find user
        const { data: users, error } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('senha', hashedPassword);

        if (error) throw error;

        if (!users || users.length === 0) {
            throw new Error('Email ou senha incorretos.');
        }

        const user = users[0];

        // Check if user is active
        if (user.ativo === 0 || user.ativo === '0') {
            throw new Error('Sua conta ainda não foi ativada. Aguarde aprovação do administrador.');
        }

        // Create session
        const session = {
            email: user.email,
            nome: user.nome,
            cargo: user.cargo,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem('loggistock_user', JSON.stringify(session));

        console.log('✅ Login bem-sucedido!');
        window.location.href = 'index.html';

    } catch (error) {
        console.error('❌ Erro no login:', error);
        throw error;
    }
}

// Check authentication
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('loggistock_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.cargo === 'Administrador';
}

// Logout
function logout() {
    localStorage.removeItem('loggistock_user');
    window.location.href = 'login.html';
}

// Initialize login page
if (window.location.pathname.includes('login.html')) {
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (errorDiv) errorDiv.classList.add('hidden');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Entrando...';
        }

        try {
            await login(email, password);
        } catch (error) {
            if (errorText) {
                errorText.textContent = error.message;
            } else if (errorDiv) {
                errorDiv.textContent = error.message;
            }
            if (errorDiv) errorDiv.classList.remove('hidden');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-2"></i>Entrar';
            }
        }
    });
}

// Initialize register page
if (window.location.pathname.includes('criar-usuario.html')) {
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const errorDiv = document.getElementById('register-error');
        const errorText = document.getElementById('register-error-text');
        const successDiv = document.getElementById('register-success');
        const successText = document.getElementById('register-success-text');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');

        if (password.length < 6) {
            const msg = 'A senha deve ter no mínimo 6 caracteres';
            if (errorText) {
                errorText.textContent = msg;
            } else if (errorDiv) {
                errorDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-2"></i>' + msg;
            }
            if (errorDiv) errorDiv.classList.remove('hidden');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Cadastrando...';
        }

        try {
            await registerUser(nome, email, password);

            const successMessage = 'Conta criada! Aguarde aprovação do administrador para fazer login.';
            if (successText) {
                successText.textContent = successMessage;
            } else if (successDiv) {
                successDiv.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>' + successMessage;
            }
            if (successDiv) successDiv.classList.remove('hidden');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);

        } catch (error) {
            const errorMessage = error.message || 'Erro ao criar conta';
            if (errorText) {
                errorText.textContent = errorMessage;
            } else if (errorDiv) {
                errorDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-2"></i>' + errorMessage;
            }
            if (errorDiv) errorDiv.classList.remove('hidden');

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-user-plus mr-2"></i>Criar Conta';
            }
        }
    });
}

// Initialize main app - check authentication
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    window.addEventListener('DOMContentLoaded', () => {
        const user = checkAuth();

        if (user) {
            // Display user info
            if (document.getElementById('user-name')) {
                document.getElementById('user-name').textContent = user.nome;
            }
            if (document.getElementById('user-role')) {
                document.getElementById('user-role').textContent = user.cargo;
            }
            console.log('✅ Usuário logado:', user.nome, `(${user.cargo})`);
        }
    });
}

// Expose functions
window.getCurrentUser = getCurrentUser;
window.login = login;
window.logout = logout;
window.registerUser = registerUser;
window.isAdmin = isAdmin;
window.checkAuth = checkAuth;

console.log('🔐 Auth Supabase carregado');
