// API Layer - SheetDB Communication
// =====================================

const API_URL = 'https://sheetdb.io/api/v1/qi3jec0p8ofj7';

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
    async updateItem(identifier, updates) {
        try {
            let endpoint;
            // Check if identifier is a number (ID) or string (Material Name)
            if (identifier && (typeof identifier === 'number' || /^\d+$/.test(identifier))) {
                endpoint = `${API_URL}/id/${identifier}?sheet=Estoque`;
            } else {
                endpoint = `${API_URL}/material/${encodeURIComponent(identifier)}?sheet=Estoque`;
            }

            const response = await fetch(endpoint, {
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
    async deleteItem(identifier, materialNameFallback = null) {
        try {
            let response;
            let usedId = false;

            // Strategy 1: Delete by Material Name (more reliable with SheetDB)
            if (materialNameFallback) {
                console.log(`🚀 Strategy 1: Delete by Material Name "${materialNameFallback}"`);
                response = await fetch(`${API_URL}/material/${encodeURIComponent(materialNameFallback)}?sheet=Estoque`, { method: 'DELETE' });
                console.log(`📊 Strategy 1 Response: Status ${response.status}, OK=${response.ok}`);
                const responseText = await response.clone().text();
                console.log(`📄 Strategy 1 Response Body:`, responseText);
            } else if (identifier && (typeof identifier === 'number' || /^\d+$/.test(identifier))) {
                console.log(`🚀 Strategy 1: Delete by ID ${identifier} (no name fallback provided)`);
                response = await fetch(`${API_URL}/id/${identifier}?sheet=Estoque`, { method: 'DELETE' });
                console.log(`📊 Strategy 1 Response: Status ${response.status}, OK=${response.ok}`);
                const responseText = await response.clone().text();
                console.log(`📄 Strategy 1 Response Body:`, responseText);
                usedId = true;
            } else {
                console.log(`🚀 Strategy 1: Delete by Material ${identifier}`);
                response = await fetch(`${API_URL}/material/${encodeURIComponent(identifier)}?sheet=Estoque`, { method: 'DELETE' });
                console.log(`📊 Strategy 1 Response: Status ${response.status}, OK=${response.ok}`);
                usedId = false;
            }

            // Strategy 2: Try by ID if name deletion failed (less common case)
            if ((!response || !response.ok || response.status === 404) && identifier && (typeof identifier === 'number' || /^\d+$/.test(identifier))) {
                console.warn(`⚠️ Strategy 1 failed. Strategy 2: Delete by ID: ${identifier}`);
                response = await fetch(`${API_URL}/id/${identifier}?sheet=Estoque`, { method: 'DELETE' });
                usedId = true;
            }

            // Strategy 3: Try the /all endpoint with query params (Nuclear option)
            if (!response || !response.ok || response.status === 404) {
                console.warn(`⚠️ Strategy 2 failed. Strategy 3: Delete via /all endpoint`);
                let query = usedId ? `id=${identifier}` : `material=${encodeURIComponent(identifier)}`;
                if (usedId && materialNameFallback) {
                    query = `material=${encodeURIComponent(materialNameFallback)}`;
                }
                response = await fetch(`${API_URL}/all?${query}&sheet=Estoque`, { method: 'DELETE' });
            }

            // Check final result
            if (!response.ok && response.status !== 404) {
                throw new Error(`Falha na exclusão: ${response.status} ${response.statusText}`);
            }

            this.cache.clear('Estoque');
            return response.ok ? await response.json() : { status: 'deleted_or_missing' };
        } catch (error) {
            console.error('API Error:', error);
            this.cache.clear('Estoque');
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

    // Remove duplicate rows from sheet
    async removeDuplicates() {
        try {
            console.log('🧹 Removing duplicates from Estoque...');
            const response = await fetch(`${API_URL}/duplicates?sheet=Estoque`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erro ao remover duplicatas');
            this.cache.clear('Estoque');
            const result = await response.json();
            console.log('✅ Duplicates removed:', result);
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
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
