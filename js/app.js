// Main Application Orchestration
// =====================================

window.stockData = [];
window.movementsData = [];
window.currentTab = 'dashboard';

// Initialize app on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 DEBUG: app.js loaded and DOMContentLoaded fired');
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

        // DEBUG: Inspect raw data
        if (stock && stock.length > 0) {
            console.log('🔍 DEBUG: Raw Keys:', Object.keys(stock[0]));
            const rawItem = stock.find(i => i.material && i.material.includes('Bota 20'));
            if (rawItem) console.log('🔍 DEBUG: Raw Item:', JSON.stringify(rawItem));
        }

        // Normalize data
        window.stockData = (stock || []).map(item => ({
            id: parseInt(item.id) || null,
            material: item.material || '',
            estoqueAtual: parseInt(item.estoqueAtual) || 0,
            estoqueCritico: parseInt(item.estoqueCritico) || 0,
            qtdRetiradas: parseInt(item.qtdRetiradas) || 0,
            epiAtivo: item.epiAtivo
        })).sort((a, b) => a.material.localeCompare(b.material));

        window.movementsData = (movements || [])
            .map(m => ({
                dataHora: m.dataHora,
                material: m.material,
                tipoOperacao: m.tipo || m.tipoOperacao, // SheetDB retorna 'tipo'
                quantidade: parseInt(m.quantidade || m.qtd) || 0,
                email: m.usuario || m.email
            }));

        // Render UI
        Components.renderKPIs(window.stockData, window.movementsData);
        Components.renderActivity(window.movementsData);
        Components.renderMaterialsTable(window.stockData);

        // Render Charts
        if (window.Charts) {
            Charts.renderCriticalItems(window.stockData);
            Charts.renderStockStatus(window.stockData);
        }

        console.log('✅ Dados carregados:', window.stockData.length, 'itens');
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        Components.showToast(error.message || 'Erro ao carregar dados', 'error');

        // Ensure UI is in a usable state even with error
        window.stockData = window.stockData || [];
        window.movementsData = window.movementsData || [];
        Components.renderMaterialsTable(window.stockData);
    } finally {
        // Always hide loading screen
        const loading = document.getElementById('loading');
        if (loading && !loading.classList.contains('hidden')) {
            loading.style.opacity = '0';
            setTimeout(() => loading.classList.add('hidden'), 300);
        }
    }
};

// Tab Switching
window.switchTab = function (tabName) {
    // Verificar permissões para inventário
    if (tabName === 'inventory') {
        const user = getCurrentUser();
        if (!user || user.cargo !== 'Administrador') {
            Components.showToast('Acesso negado: apenas Administradores', 'error');
            return;
        }
    }

    // Hide all views
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-analytics').classList.add('hidden');
    document.getElementById('view-materials').classList.add('hidden');
    const inventoryView = document.getElementById('view-inventory');
    if (inventoryView) inventoryView.classList.add('hidden');

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

            // Fix: Resize charts to prevent distortion when switching tabs
            setTimeout(() => {
                if (Charts.instances.comparison) Charts.instances.comparison.resize();
                if (Charts.instances.timeline) Charts.instances.timeline.resize();
            }, 150);
        }, 100);
    }

    // Load inventory when switching to inventory tab
    if (tabName === 'inventory' && typeof Inventory !== 'undefined') {
        Inventory.loadHistory();
        Inventory.renderCurrentItems();
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

    // Also update charts if they are visible
    if (window.movementsData && window.stockData) {
        // Filter movements to match the filtered stock items (e.g. only show EPI movements if EPI filter is active)
        const allowedMaterials = new Set(filtered.map(i => i.material));
        const filteredMovements = window.movementsData.filter(m => allowedMaterials.has(m.material));

        Charts.renderMovementTimeline(filteredMovements, window.stockData, period);
    }

    Components.showToast(`Filtros aplicados: ${filtered.length} itens`, 'success');
};

// Setup event listeners
function setupEventListeners() {

    // Scanner button
    const btnScanner = document.getElementById('btn-scanner');
    if (btnScanner) {
        btnScanner.addEventListener('click', () => {
            console.log('🔘 Scanner button clicked');
            Scanner.start();
            document.getElementById('modal-scanner').classList.remove('hidden');
        });
    }

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

    document.getElementById('movement-close').addEventListener('click', () => {
        document.getElementById('modal-movement').classList.add('hidden');
    });

    // Form submit
    document.getElementById('form-item').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleItemSave();
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
    console.log('🔘 Open Item Modal called', item ? '(Edit)' : '(New)');
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
    const isEpi = document.getElementById('input-epi').checked ? 1 : 0;
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
            // Generate new ID
            const maxId = window.stockData.reduce((max, item) => Math.max(max, item.id || 0), 0);
            const newId = maxId + 1;

            await API.createItem({
                id: newId,
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

// Search materials
const searchMaterials = document.getElementById('search-materials');
if (searchMaterials) {
    searchMaterials.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = window.stockData.filter(item =>
            item.material.toLowerCase().includes(searchTerm) ||
            (item.id && item.id.toString() === searchTerm)
        );
        Components.renderMaterialsTable(filtered);
    });
}

// Function to open scanner specifically for inventory
function openInventoryScanner() {
    Scanner.start();
    document.getElementById('modal-scanner').classList.remove('hidden');
}

window.openInventoryScanner = openInventoryScanner;

// ===== AUTOCOMPLETE INVENTÁRIO =====
const invSearch = document.getElementById('inventory-search');
const invSuggestions = document.getElementById('inventory-suggestions');

if (invSearch && invSuggestions) {
    invSearch.addEventListener('input', (e) => {
        const term = e.target.value.trim().toLowerCase();

        if (!term || term.length < 1) {
            invSuggestions.classList.add('hidden');
            invSuggestions.innerHTML = '';
            return;
        }

        // Filtrar por ID ou Nome
        const items = window.stockData.filter(item =>
            item.id.toString().includes(term) ||
            item.material.toLowerCase().includes(term)
        ).slice(0, 8);

        if (items.length === 0) {
            invSuggestions.classList.add('hidden');
            return;
        }

        // Renderizar
        invSuggestions.innerHTML = items.map(item => `
            <div class="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0" data-id="${item.id}">
                <div class="font-semibold text-slate-900">${item.material}</div>
                <div class="text-xs text-slate-500">ID: ${item.id} • Estoque: ${item.estoqueAtual}</div>
            </div>
        `).join('');

        invSuggestions.classList.remove('hidden');

        // Click nas sugestões
        invSuggestions.querySelectorAll('[data-id]').forEach(el => {
            el.addEventListener('click', () => {
                const item = window.stockData.find(i => i.id === parseInt(el.dataset.id));
                if (item && Inventory) {
                    Inventory.addItem(item);
                    invSearch.value = '';
                    invSuggestions.classList.add('hidden');
                }
            });
        });
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!invSearch.contains(e.target) && !invSuggestions.contains(e.target)) {
            invSuggestions.classList.add('hidden');
        }
    });

    // Enter para selecionar primeiro
    invSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const first = invSuggestions.querySelector('[data-id]');
            if (first) first.click();
            else Inventory.startCount();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const fabToggle = document.getElementById('fab-toggle');
        const fabMenu = document.getElementById('fab-menu');
        const fabItems = document.querySelectorAll('.fab-item');

        if (fabToggle && fabMenu) {
            let isOpen = false;

            fabToggle.addEventListener('click', () => {
                isOpen = !isOpen;

                if (isOpen) {
                    // Abrir: ícone roda 45° e botões aparecem
                    fabToggle.style.transform = 'rotate(45deg)';
                    fabItems.forEach(item => item.classList.add('show'));
                } else {
                    // Fechar: ícone volta e botões desaparecem
                    fabToggle.style.transform = 'rotate(0deg)';
                    fabItems.forEach(item => item.classList.remove('show'));
                }
            });
        }
    }, 200);
});