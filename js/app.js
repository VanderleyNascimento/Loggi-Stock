// Main Application Orchestration
// =====================================

window.stockData = [];
window.movementsData = [];
window.currentTab = 'dashboard';

// Initialize app on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ App initialized');
    console.log('🚀 LoggiStock iniciando...');

    // Display user info
    const user = getCurrentUser();
    if (user) {
        document.getElementById('user-name').textContent = user.nome;
        document.getElementById('user-role').textContent = user.cargo;
    }

    await loadData();
    switchTab('dashboard');

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 300);
    }, 500);

    setupEventListeners();
});

// Load data from API
window.loadData = async function () {
    try {
        const [stock, movements] = await Promise.all([
            API.getStock(),
            API.getMovements()
        ]);

        // Normalize data
        window.stockData = stock.map(item => ({
            material: item.material || '',
            estoqueAtual: parseInt(item.estoqueAtual) || 0,
            estoqueCritico: parseInt(item.estoqueCritico) || 0,
            qtdRetiradas: parseInt(item.qtdRetiradas) || 0,
            epiAtivo: item.epiAtivo
        }));

        window.movementsData = movements
            .map(m => ({
                dataHora: m.dataHora,
                material: m.material,
                tipoOperacao: m.tipoOperacao,
                quantidade: parseInt(m.quantidade) || 0,
                email: m.email
            }))
            .reverse();

        // Render UI
        Components.renderKPIs(window.stockData, window.movementsData);
        Components.renderActivity(window.movementsData);
        Components.renderMaterialsTable(window.stockData);

        // Render Charts
        Charts.renderCriticalItems(window.stockData);
        Charts.renderStockStatus(window.stockData);

        console.log('✅ Dados carregados:', window.stockData.length, 'itens');
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        Components.showToast('Erro ao carregar dados', 'error');
    }
};

// Tab Switching
window.switchTab = function (tabName) {
    // Hide all views
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-analytics').classList.add('hidden');
    document.getElementById('view-materials').classList.add('hidden');

    // Show selected view
    document.getElementById(`view-${tabName}`).classList.remove('hidden');

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    window.currentTab = tabName;

    // Render analytics charts when switching to analytics tab
    if (tabName === 'analytics' && window.stockData.length > 0) {
        setTimeout(() => {
            Charts.renderAllAnalytics(window.stockData, window.movementsData);
        }, 100);
    }
};

// Apply Filters
window.applyFilters = function () {
    const status = document.getElementById('filter-status').value;
    const type = document.getElementById('filter-type').value;
    const period = parseInt(document.getElementById('filter-period').value);

    let filtered = [...window.stockData];

    // Filter by status
    if (status === 'critical') {
        filtered = filtered.filter(i => i.estoqueAtual <= i.estoqueCritico);
    } else if (status === 'warning') {
        filtered = filtered.filter(i => i.estoqueAtual > i.estoqueCritico && i.estoqueAtual <= i.estoqueCritico * 1.5);
    } else if (status === 'ok') {
        filtered = filtered.filter(i => i.estoqueAtual > i.estoqueCritico * 1.5);
    }

    // Filter by type
    if (type === 'epi') {
        filtered = filtered.filter(i => i.epiAtivo === 'Sim' || i.epiAtivo == 1);
    } else if (type === 'normal') {
        filtered = filtered.filter(i => i.epiAtivo !== 'Sim' && i.epiAtivo != 1);
    }

    // Re-render with filtered data
    Components.renderMaterialsTable(filtered);
    Components.showToast(`Filtros aplicados: ${filtered.length} itens`, 'success');
};

// Setup event listeners
function setupEventListeners() {

    // Scanner button
    document.getElementById('btn-scanner').addEventListener('click', () => {
        Scanner.start();
    });

    // Scanner close
    document.getElementById('scanner-close').addEventListener('click', () => {
        Scanner.stop();
    });

    // Manual search
    document.getElementById('manual-search').addEventListener('click', () => {
        const text = document.getElementById('manual-input').value.trim();
        if (text) {
            Scanner.stop();
            Scanner.searchAndOpenItem(text);
            document.getElementById('manual-input').value = '';
        }
    });

    // Add item button (materials view)
    document.getElementById('btn-add-item-materials').addEventListener('click', () => {
        openItemModal();
    });

    // Close modals
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('modal-item').classList.add('hidden');
    });

    document.getElementById('movement-close').addEventListener('click', () => {
        document.getElementById('modal-movement').classList.add('hidden');
    });

    // Form submit
    document.getElementById('form-item').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleItemSave();
    });

    // Search materials
    document.getElementById('search-materials').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = window.stockData.filter(item =>
            item.material.toLowerCase().includes(searchTerm)
        );
        Components.renderMaterialsTable(filtered);
    });

    // Close modals on overlay click
    document.getElementById('modal-item').addEventListener('click', (e) => {
        if (e.target.id === 'modal-item') {
            document.getElementById('modal-item').classList.add('hidden');
        }
    });

    document.getElementById('modal-movement').addEventListener('click', (e) => {
        if (e.target.id === 'modal-movement') {
            document.getElementById('modal-movement').classList.add('hidden');
        }
    });
}

// Open item modal (create/edit)
function openItemModal(item = null) {
    const modal = document.getElementById('modal-item');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('form-item');

    if (item) {
        title.textContent = 'Editar Item';
        document.getElementById('input-name').value = item.material;
        document.getElementById('input-qty').value = item.estoqueAtual;
        document.getElementById('input-min').value = item.estoqueCritico;
        document.getElementById('input-epi').checked = item.epiAtivo === 'Sim' || item.epiAtivo == 1;
    } else {
        title.textContent = 'Novo Item';
        form.reset();
    }

    modal.classList.remove('hidden');
}

// Load data from API
window.loadData = async function () {
    try {
        const [stock, movements] = await Promise.all([
            API.getStock(),
            API.getMovements()
        ]);

        // Normalize data
        window.stockData = stock.map(item => ({
            material: item.material || '',
            estoqueAtual: parseInt(item.estoqueAtual) || 0,
            estoqueCritico: parseInt(item.estoqueCritico) || 0,
            qtdRetiradas: parseInt(item.qtdRetiradas) || 0,
            epiAtivo: item.epiAtivo
        }));

        window.movementsData = movements
            .map(m => ({
                dataHora: m.dataHora,
                material: m.material,
                tipoOperacao: m.tipoOperacao,
                quantidade: parseInt(m.quantidade) || 0,
                email: m.email
            }))
            .reverse();

        // Render UI
        Components.renderKPIs(window.stockData, window.movementsData);
        Components.renderActivity(window.movementsData);
        Components.renderMaterialsTable(window.stockData);

        // Render Charts
        Charts.renderCriticalItems(window.stockData);
        Charts.renderStockStatus(window.stockData);

        console.log('✅ Dados carregados:', window.stockData.length, 'itens');
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        Components.showToast('Erro ao carregar dados', 'error');
    }
};

// Tab Switching
window.switchTab = function (tabName) {
    // Hide all views
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-analytics').classList.add('hidden');
    document.getElementById('view-materials').classList.add('hidden');

    // Show selected view
    document.getElementById(`view-${tabName}`).classList.remove('hidden');

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    window.currentTab = tabName;

    // Render analytics charts when switching to analytics tab
    if (tabName === 'analytics' && window.stockData.length > 0) {
        setTimeout(() => {
            Charts.renderAllAnalytics(window.stockData, window.movementsData);
        }, 100);
    }
};

// Apply Filters
window.applyFilters = function () {
    const status = document.getElementById('filter-status').value;
    const type = document.getElementById('filter-type').value;
    const period = parseInt(document.getElementById('filter-period').value);

    let filtered = [...window.stockData];

    // Filter by status
    if (status === 'critical') {
        filtered = filtered.filter(i => i.estoqueAtual <= i.estoqueCritico);
    } else if (status === 'warning') {
        filtered = filtered.filter(i => i.estoqueAtual > i.estoqueCritico && i.estoqueAtual <= i.estoqueCritico * 1.5);
    } else if (status === 'ok') {
        filtered = filtered.filter(i => i.estoqueAtual > i.estoqueCritico * 1.5);
    }

    // Filter by type
    if (type === 'epi') {
        filtered = filtered.filter(i => i.epiAtivo === 'Sim' || i.epiAtivo == 1);
    } else if (type === 'normal') {
        filtered = filtered.filter(i => i.epiAtivo !== 'Sim' && i.epiAtivo != 1);
    }

    // Re-render with filtered data
    Components.renderMaterialsTable(filtered);
    Components.showToast(`Filtros aplicados: ${filtered.length} itens`, 'success');
};

// Setup event listeners
function setupEventListeners() {

    // Scanner button
    document.getElementById('btn-scanner').addEventListener('click', () => {
        Scanner.start();
    });

    // Scanner close
    document.getElementById('scanner-close').addEventListener('click', () => {
        Scanner.stop();
    });

    // Manual search
    document.getElementById('manual-search').addEventListener('click', () => {
        const text = document.getElementById('manual-input').value.trim();
        if (text) {
            Scanner.stop();
            Scanner.searchAndOpenItem(text);
            document.getElementById('manual-input').value = '';
        }
    });

    // Add item button (materials view)
    document.getElementById('btn-add-item-materials').addEventListener('click', () => {
        openItemModal();
    });

    // Close modals
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('modal-item').classList.add('hidden');
    });

    document.getElementById('movement-close').addEventListener('click', () => {
        document.getElementById('modal-movement').classList.add('hidden');
    });

    // Form submit
    document.getElementById('form-item').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleItemSave();
    });

    // Search materials
    document.getElementById('search-materials').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = window.stockData.filter(item =>
            item.material.toLowerCase().includes(searchTerm)
        );
        Components.renderMaterialsTable(filtered);
    });

    // Close modals on overlay click
    document.getElementById('modal-item').addEventListener('click', (e) => {
        if (e.target.id === 'modal-item') {
            document.getElementById('modal-item').classList.add('hidden');
        }
    });

    document.getElementById('modal-movement').addEventListener('click', (e) => {
        if (e.target.id === 'modal-movement') {
            document.getElementById('modal-movement').classList.add('hidden');
        }
    });
}

// Open item modal (create/edit)
function openItemModal(item = null) {
    const modal = document.getElementById('modal-item');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('form-item');

    if (item) {
        title.textContent = 'Editar Item';
        document.getElementById('input-name').value = item.material;
        document.getElementById('input-qty').value = item.estoqueAtual;
        document.getElementById('input-min').value = item.estoqueCritico;
        document.getElementById('input-epi').checked = item.epiAtivo === 'Sim' || item.epiAtivo == 1;
    } else {
        title.textContent = 'Novo Item';
        form.reset();
    }

    modal.classList.remove('hidden');
}

// Save item (create/update)
async function handleItemSave() {
    const name = document.getElementById('input-name').value;
    const qty = parseInt(document.getElementById('input-qty').value);
    const min = parseInt(document.getElementById('input-min').value);
    const isEpi = document.getElementById('input-epi').checked ? 'Sim' : 'Não';
    const submitBtn = document.querySelector('#form-item button[type="submit"]');

    // Set loading state
    submitBtn.id = 'btn-save-item'; // Ensure ID exists
    Components.setButtonLoading('btn-save-item', true, 'Salvando...');

    try {
        const existing = window.stockData.find(i => i.material === name);

        if (existing) {
            // Update
            await API.updateItem(name, {
                estoqueAtual: qty,
                estoqueCritico: min,
                epiAtivo: isEpi
            });
            Components.showToast('Item atualizado com sucesso!', 'success');
        } else {
            // Create
            await API.createItem({
                material: name,
                estoqueAtual: qty,
                estoqueCritico: min,
                epiAtivo: isEpi,
                qtdRetiradas: 0
            });
            Components.showToast('Item criado com sucesso!', 'success');
        }

        document.getElementById('modal-item').classList.add('hidden');
        await loadData();
    } catch (error) {
        console.error(error);
        Components.showToast('Erro ao salvar item', 'error');
    } finally {
        Components.setButtonLoading('btn-save-item', false);
    }
}

// Movement functions are now handled by Components.js
// window.openMovementModal and window.handleMovement removed to avoid conflicts
