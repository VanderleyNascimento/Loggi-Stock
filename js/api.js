// API Layer - SheetDB Communication
// =====================================

const API_URL = 'https://sheetdb.io/api/v1/eqj0lnjk4yht0';

const API = {
    // Fetch all stock items
    async getStock() {
        try {
            const response = await fetch(`${API_URL}?sheet=Estoque`);
            if (!response.ok) throw new Error('Erro ao buscar estoque');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Fetch all movements
    async getMovements() {
        try {
            const response = await fetch(`${API_URL}?sheet=Movimentacoes`);
            if (!response.ok) throw new Error('Erro ao buscar movimentações');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
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
                    dataHora: new Date().toLocaleString('pt-BR') // Save as DD/MM/YYYY HH:mm:ss
                })
            });
            if (!response.ok) throw new Error('Erro ao registrar movimentação');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
