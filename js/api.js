// API Layer - SheetDB Communication
// =====================================

const API_URL = 'https://sheetdb.io/api/v1/tf5zivcixv43a';

const API = {
    // Cache configuration
    cache: {
        ttl: 5 * 60 * 1000, // 5 minutes
        get(key) {
            const cached = localStorage.getItem(`api_cache_${key}`);
            if (!cached) return null;
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp > this.ttl) {
                localStorage.removeItem(`api_cache_${key}`);
                return null;
            }
            return data;
        },
        set(key, data) {
            localStorage.setItem(`api_cache_${key}`, JSON.stringify({
                timestamp: Date.now(),
                data
            }));
        },
        clear(key) {
            if (key) {
                localStorage.removeItem(`api_cache_${key}`);
            } else {
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('api_cache_')) localStorage.removeItem(k);
                });
            }
        }
    },

    // Helper for cached fetch
    async fetchWithCache(endpoint, sheetName) {
        const cacheKey = sheetName;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            console.log(`📦 Serving ${sheetName} from cache`);
            return cachedData;
        }

        try {
            const response = await fetch(`${API_URL}?sheet=${sheetName}`);
            if (response.status === 429) {
                console.warn('⚠️ API Rate Limit Reached. Using fallback/empty data.');
                // Try to return stale cache if available, ignoring TTL
                const stale = localStorage.getItem(`api_cache_${cacheKey}`);
                if (stale) return JSON.parse(stale).data;
                throw new Error('Limite de requisições excedido. Tente novamente em alguns instantes.');
            }
            if (!response.ok) throw new Error(`Erro ao buscar ${sheetName}`);

            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Fetch all stock items
    async getStock() {
        return this.fetchWithCache(API_URL, 'Estoque');
    },

    // Fetch all movements
    async getMovements() {
        return this.fetchWithCache(API_URL, 'Movimentacoes');
    },

    // Create new stock item
    async createItem(item) {
        try {
            const response = await fetch(`${API_URL}?sheet=Estoque`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!response.ok) throw new Error('Erro ao criar item');
            this.cache.clear('Estoque'); // Invalidate cache
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Update stock item
    async updateItem(materialName, updates) {
        try {
            const response = await fetch(`${API_URL}/material/${encodeURIComponent(materialName)}?sheet=Estoque`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Erro ao atualizar item');
            this.cache.clear('Estoque'); // Invalidate cache
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Delete stock item
    async deleteItem(materialName) {
        try {
            const response = await fetch(`${API_URL}/material/${encodeURIComponent(materialName)}?sheet=Estoque`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erro ao deletar item');
            this.cache.clear('Estoque'); // Invalidate cache
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Create movement record
    async createMovement(movement) {
        try {
            const response = await fetch(`${API_URL}?sheet=Movimentacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...movement,
                    dataHora: new Date().toLocaleString('pt-BR')
                })
            });
            if (!response.ok) throw new Error('Erro ao registrar movimentação');
            this.cache.clear('Movimentacoes'); // Invalidate cache
            this.cache.clear('Estoque'); // Stock likely changed too
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Alias for compatibility (registerMovement -> createMovement)
    async registerMovement(movement) {
        return this.createMovement(movement);
    },

    // Get inventory history
    async getInventoryHistory() {
        return this.fetchWithCache(API_URL, 'Inventario');
    },

    // Create inventory record
    async createInventory(inventory) {
        try {
            const response = await fetch(`${API_URL}?sheet=Inventario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...inventory,
                    dataHora: new Date().toLocaleString('pt-BR')
                })
            });
            if (!response.ok) throw new Error('Erro ao registrar inventário');
            this.cache.clear('Inventario'); // Invalidate cache
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

window.API = API;
