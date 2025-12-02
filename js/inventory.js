// Inventory Module - Physical Stock Count Management
// ====================================================

const Inventory = {
    currentItems: [],
    inventoryHistory: [],

    // Inicializar histórico
    async loadHistory() {
        try {
            this.inventoryHistory = await API.getInventoryHistory();
            this.renderHistory();
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    },

    // Buscar item por ID ou nome
    async findItem(searchTerm) {
        // Tentar por ID primeiro (se for número)
        if (/^\d+$/.test(searchTerm)) {
            const item = window.stockData.find(i => i.id === parseInt(searchTerm));
            if (item) return item;
        }

        // Buscar por nome
        return window.stockData.find(i =>
            i.material.toLowerCase().includes(searchTerm.toLowerCase())
        );
    },

    // Iniciar contagem de um item
    async startCount() {
        const searchInput = document.getElementById('inventory-search');
        const searchTerm = searchInput.value.trim();

        if (!searchTerm) {
            Components.showToast('Digite o ID ou nome do item', 'error');
            return;
        }

        const item = await this.findItem(searchTerm);

        if (!item) {
            Components.showToast('Item não encontrado', 'error');
            return;
        }

        this.addItem(item);
        searchInput.value = '';
    },

    // Adicionar item à lista de contagem
    addItem(item) {
        // Verificar se já está na lista
        if (this.currentItems.find(i => i.id === item.id)) {
            Components.showToast('Item já está na lista de contagem', 'error');
            return;
        }

        // Adicionar à lista
        this.currentItems.push({
            id: item.id,
            material: item.material,
            estoqueVirtual: item.estoqueAtual,
            estoqueFisico: item.estoqueAtual, // Valor inicial = virtual
            diferenca: 0,
            status: 'Pendente'
        });

        this.renderCurrentItems();
        Components.showToast(`${item.material} adicionado à contagem`, 'success');
    },

    // Atualizar contagem física
    updatePhysicalCount(itemId, value) {
        const item = this.currentItems.find(i => i.id === itemId);
        if (item) {
            item.estoqueFisico = parseInt(value) || 0;
            item.diferenca = item.estoqueFisico - item.estoqueVirtual;
            this.updateSummary();
        }
    },

    // Remover item da contagem
    removeItem(itemId) {
        this.currentItems = this.currentItems.filter(i => i.id !== itemId);
        this.renderCurrentItems();
    },

    // Abrir modal de contagem
    openModal(itemId) {
        const item = this.currentItems.find(i => i.id === itemId);
        if (item) {
            Components.showInventoryModal(item);
        }
    },

    // Renderizar itens em contagem
    renderCurrentItems() {
        const container = document.getElementById('inventory-list');

        if (this.currentItems.length === 0) {
            container.innerHTML = `
                <div class="bg-slate-50 rounded-xl p-8 text-center">
                    <i class="fa-solid fa-clipboard-list text-4xl text-slate-300 mb-3"></i>
                    <p class="text-slate-500">Nenhum item em contagem</p>
                    <p class="text-xs text-slate-400 mt-1">Use o campo acima para adicionar itens</p>
                </div>`;
            this.updateSummary();
            return;
        }

        container.innerHTML = this.currentItems.map(item => {
            const diffClass = item.diferenca > 0 ? 'text-green-600' :
                item.diferenca < 0 ? 'text-red-600' : 'text-slate-600';
            const diffIcon = item.diferenca > 0 ? '📈' :
                item.diferenca < 0 ? '📉' : '➖';

            return `
                <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-mono bg-slate-100 px-2 py-1 rounded">ID: ${item.id}</span>
                                <h3 class="font-bold text-slate-900">${item.material}</h3>
                            </div>
                            <div class="flex items-center gap-4 text-sm mt-2">
                                <div>
                                    <span class="text-slate-500">Virtual:</span>
                                    <span class="font-semibold text-slate-900">${item.estoqueVirtual}</span>
                                </div>
                                <div class="${diffClass}">
                                    ${diffIcon} <span class="font-bold">${item.diferenca >= 0 ? '+' : ''}${item.diferenca}</span>
                                </div>
                            </div>
                        </div>
                        <button onclick="Inventory.removeItem(${item.id})" 
                            class="text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg transition-colors"
                            title="Remover">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <label class="text-sm font-semibold text-slate-700 whitespace-nowrap">Físico:</label>
                        <input type="number" 
                            value="${item.estoqueFisico}" 
                            onchange="Inventory.updatePhysicalCount(${item.id}, this.value)"
                            class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-lg font-semibold"
                            onclick="this.select()">
                    </div>
                </div>
            `;
        }).join('');

        this.updateSummary();
    },

    // Atualizar resumo
    updateSummary() {
        const total = this.currentItems.length;
        const sobras = this.currentItems.filter(i => i.diferenca > 0).length;
        const faltas = this.currentItems.filter(i => i.diferenca < 0).length;

        document.getElementById('inv-total').textContent = total;
        document.getElementById('inv-sobras').textContent = sobras;
        document.getElementById('inv-faltas').textContent = faltas;

        // Habilitar/desabilitar botão de finalizar
        const finalizeBtn = document.querySelector('#view-inventory button[onclick*="finalizeInventory"]');
        if (finalizeBtn) {
            finalizeBtn.disabled = total === 0;
            finalizeBtn.classList.toggle('opacity-50', total === 0);
            finalizeBtn.classList.toggle('cursor-not-allowed', total === 0);
        }
    },

    // Finalizar inventário
    async finalize() {
        if (this.currentItems.length === 0) {
            Components.showToast('Nenhum item para finalizar', 'error');
            return;
        }

        // Use beautiful confirm modal
        const confirmed = await ConfirmModal.show({
            title: 'Finalizar Inventário',
            message: `Finalizar inventário de ${this.currentItems.length} itens?\n\nIsso atualizará o estoque no sistema.`,
            confirmText: 'Finalizar',
            cancelText: 'Cancelar',
            type: 'warning'
        });

        if (!confirmed) {
            return;
        }

        const user = getCurrentUser();
        const btnId = 'btn-finalize-inventory';
        Components.setButtonLoading(btnId, true, 'Finalizando...');

        try {
            for (const item of this.currentItems) {
                // 1. Salvar no histórico
                await API.createInventory({
                    idItem: item.id,
                    material: item.material,
                    estoqueVirtual: item.estoqueVirtual,
                    estoqueFisico: item.estoqueFisico,
                    diferenca: item.diferenca,
                    usuario: user.email,
                    status: 'Finalizado'
                });

                // 2. Atualizar estoque
                await API.updateItem(item.id, {
                    estoqueAtual: item.estoqueFisico
                });
            }

            Components.showToast('Inventário finalizado com sucesso!', 'success');

            // Recarregar dados
            await loadData();

            // Limpar lista
            this.currentItems = [];
            this.renderCurrentItems();

            // Recarregar histórico
            await this.loadHistory();

        } catch (error) {
            console.error('Erro ao finalizar inventário:', error);
            Components.showToast('Erro ao finalizar inventário', 'error');
        } finally {
            Components.setButtonLoading(btnId, false);
        }
    },

    // Renderizar histórico
    renderHistory() {
        const container = document.getElementById('inventory-history');
        if (!container) return;

        if (this.inventoryHistory.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-slate-500">
                    <i class="fa-solid fa-clock-rotate-left text-3xl mb-2"></i>
                    <p>Nenhum inventário anterior</p>
                </div>`;
            return;
        }

        // Agrupar por data
        const grouped = {};
        this.inventoryHistory.forEach(inv => {
            let date;
            // Handle ISO date from Supabase
            if (inv.dataHora && inv.dataHora.includes('T')) {
                const d = new Date(inv.dataHora);
                date = d.toLocaleDateString('pt-BR');
            } else if (inv.dataHora) {
                // Handle legacy format (DD/MM/YYYY, HH:MM:SS)
                date = inv.dataHora.split(',')[0];
            } else {
                date = 'Data desconhecida';
            }

            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(inv);
        });

        container.innerHTML = Object.entries(grouped).map(([date, items]) => `
            <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-bold text-slate-900">📅 ${date}</h3>
                    <span class="text-xs bg-slate-100 px-2 py-1 rounded">${items.length} itens</span>
                </div>
                <div class="space-y-2">
                    ${items.map(inv => `
                        <div class="flex items-center justify-between text-sm py-2 border-t border-slate-100">
                            <div class="flex-1">
                                <span class="font-mono text-xs text-slate-500">ID: ${inv.idItem}</span>
                                <span class="font-semibold text-slate-900 ml-2">${inv.material}</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-slate-600">${inv.estoqueVirtual} → ${inv.estoqueFisico}</span>
                                <span class="${inv.diferenca >= 0 ? 'text-green-600' : 'text-red-600'} font-bold">
                                    ${inv.diferenca >= 0 ? '+' : ''}${inv.diferenca}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
};

window.Inventory = Inventory;
