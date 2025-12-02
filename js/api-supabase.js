// API Layer - Supabase Communication
// =====================================

const API = {
    // Get all stock items
    async getStock() {
        try {
            const { data, error } = await window.supabaseClient
                .from('estoque')
                .select('*')
                .order('material', { ascending: true });

            if (error) throw error;

            // Transform lowercase columns to camelCase for app compatibility
            return (data || []).map(item => ({
                id: item.id,
                material: item.material,
                estoqueAtual: item.estoqueatual,
                estoqueCritico: item.estoquecritico,
                qtdRetiradas: item.qtdretiradas,
                epiAtivo: item.epiativo
            }));
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Get all movements
    async getMovements() {
        try {
            const { data, error } = await window.supabaseClient
                .from('movimentacoes')
                .select('*')
                .order('datahora', { ascending: false });

            if (error) throw error;

            // Transform to camelCase
            return (data || []).map(mov => ({
                dataHora: mov.datahora,
                material: mov.material,
                tipo: mov.tipooperacao,
                tipoOperacao: mov.tipooperacao,
                quantidade: mov.quantidade,
                usuario: mov.email,
                email: mov.email
            }));
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Create new stock item
    async createItem(item) {
        try {
            const { data, error } = await window.supabaseClient
                .from('estoque')
                .insert([{
                    id: item.id,
                    material: item.material,
                    estoqueatual: item.estoqueAtual,
                    estoquecritico: item.estoqueCritico,
                    qtdretiradas: item.qtdRetiradas || 0,
                    epiativo: item.epiAtivo
                }])
                .select();

            if (error) throw error;
            const result = data[0];
            return {
                id: result.id,
                material: result.material,
                estoqueAtual: result.estoqueatual,
                estoqueCritico: result.estoquecritico,
                qtdRetiradas: result.qtdretiradas,
                epiAtivo: result.epiativo
            };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Update stock item
    async updateItem(id, updates) {
        try {
            // Convert camelCase to lowercase
            const dbUpdates = {};
            if (updates.estoqueAtual !== undefined) dbUpdates.estoqueatual = updates.estoqueAtual;
            if (updates.estoqueCritico !== undefined) dbUpdates.estoquecritico = updates.estoqueCritico;
            if (updates.qtdRetiradas !== undefined) dbUpdates.qtdretiradas = updates.qtdRetiradas;
            if (updates.epiAtivo !== undefined) dbUpdates.epiativo = updates.epiAtivo;
            if (updates.material !== undefined) dbUpdates.material = updates.material;

            const { data, error } = await window.supabaseClient
                .from('estoque')
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) throw error;
            const result = data[0];
            return {
                id: result.id,
                material: result.material,
                estoqueAtual: result.estoqueatual,
                estoqueCritico: result.estoquecritico,
                qtdRetiradas: result.qtdretiradas,
                epiAtivo: result.epiativo
            };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Delete stock item
    async deleteItem(id) {
        try {
            console.log(`🗑️ Deleting item with ID: ${id}`);

            const { error } = await window.supabaseClient
                .from('estoque')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('✅ Item deleted successfully');
            return { deleted: 1 };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Create movement record
    async createMovement(movement) {
        try {
            console.log('📝 Creating movement:', movement);

            const payload = {
                datahora: movement.dataHora || new Date().toISOString(),
                material: movement.material,
                tipooperacao: movement.tipo || movement.tipoOperacao,
                quantidade: movement.quantidade,
                email: movement.usuario || movement.email
            };

            console.log('📤 Sending to Supabase:', payload);

            const { data, error } = await window.supabaseClient
                .from('movimentacoes')
                .insert([payload])
                .select();

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log('✅ Movement created:', data);

            const result = data[0];
            return {
                dataHora: result.datahora,
                material: result.material,
                tipoOperacao: result.tipooperacao,
                quantidade: result.quantidade,
                email: result.email
            };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Alias for compatibility
    async registerMovement(movement) {
        return this.createMovement(movement);
    },

    // Get inventory history
    async getInventoryHistory() {
        try {
            const { data, error } = await window.supabaseClient
                .from('inventario')
                .select('*')
                .order('datainventario', { ascending: false });

            if (error) throw error;

            // Map to camelCase and normalize fields for inventory.js
            return (data || []).map(item => ({
                id: item.id,
                // Use datainventario as dataHora. 
                // Note: It's an ISO string from Supabase, inventory.js might need adjustment if it expects "DD/MM/YYYY, HH:MM"
                dataHora: item.datainventario,
                idItem: item.id, // inventory.js expects idItem
                material: item.material,
                estoqueVirtual: item.estoqueanterior,
                estoqueFisico: item.estoquecontado,
                diferenca: item.diferenca,
                usuario: item.email
            }));
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Create inventory record
    async createInventory(record) {
        try {
            console.log('📝 Creating inventory record:', record);

            const payload = {
                datainventario: new Date().toISOString(),
                material: record.material,
                estoqueanterior: record.estoqueVirtual,
                estoquecontado: record.estoqueFisico,
                diferenca: record.diferenca,
                email: record.usuario
            };

            console.log('📤 Sending to Supabase:', payload);

            const { data, error } = await window.supabaseClient
                .from('inventario')
                .insert([payload])
                .select();

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log('✅ Inventory record created:', data);
            return data[0];
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Get users
    async getUsers() {
        try {
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Make API globally available
window.API = API;
