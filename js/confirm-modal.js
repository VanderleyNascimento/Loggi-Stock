// Confirmation Modal System
// =====================================

const ConfirmModal = {
    modal: null,

    // Initialize modal
    init() {
        if (!this.modal) {
            this.modal = document.createElement('div');
            this.modal.id = 'confirm-modal';
            this.modal.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
            this.modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in">
                    <div class="p-6">
                        <div class="flex items-start gap-4">
                            <div id="confirm-icon" class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                                <i class="fa-solid text-xl"></i>
                            </div>
                            <div class="flex-1">
                                <h3 id="confirm-title" class="text-lg font-bold text-slate-900 mb-2"></h3>
                                <p id="confirm-message" class="text-sm text-slate-600"></p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-50 px-6 py-4 rounded-b-2xl flex gap-3 justify-end">
                        <button id="confirm-cancel" class="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button id="confirm-ok" class="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors">
                            Confirmar
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(this.modal);

            // Click outside to close
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hide();
                }
            });
        }
    },

    // Show confirmation modal
    show(options = {}) {
        return new Promise((resolve) => {
            this.init();

            const {
                title = 'Confirmar Ação',
                message = 'Tem certeza que deseja continuar?',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                type = 'warning' // warning, danger, info, success
            } = options;

            // Set content
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-ok').textContent = confirmText;
            document.getElementById('confirm-cancel').textContent = cancelText;

            // Set colors based on type
            const icon = document.getElementById('confirm-icon');
            const okBtn = document.getElementById('confirm-ok');
            const iconElement = icon.querySelector('i');

            if (type === 'danger') {
                icon.className = 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-red-100';
                iconElement.className = 'fa-solid fa-triangle-exclamation text-xl text-red-600';
                okBtn.className = 'px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors';
            } else if (type === 'warning') {
                icon.className = 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100';
                iconElement.className = 'fa-solid fa-exclamation-circle text-xl text-yellow-600';
                okBtn.className = 'px-4 py-2 text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors';
            } else if (type === 'success') {
                icon.className = 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-green-100';
                iconElement.className = 'fa-solid fa-check-circle text-xl text-green-600';
                okBtn.className = 'px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors';
            } else {
                icon.className = 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-blue-100';
                iconElement.className = 'fa-solid fa-info-circle text-xl text-blue-600';
                okBtn.className = 'px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors';
            }

            // Show modal
            this.modal.classList.remove('hidden');

            // Handle buttons
            const handleOk = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                this.hide();
                document.getElementById('confirm-ok').removeEventListener('click', handleOk);
                document.getElementById('confirm-cancel').removeEventListener('click', handleCancel);
            };

            document.getElementById('confirm-ok').addEventListener('click', handleOk);
            document.getElementById('confirm-cancel').addEventListener('click', handleCancel);

            // ESC key to cancel
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    },

    // Hide modal
    hide() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    },

    // Convenience method for delete confirmations
    async confirmDelete(itemName) {
        return await this.show({
            title: 'Excluir Item',
            message: `Tem certeza que deseja excluir o item "${itemName}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            type: 'danger'
        });
    },

    // Convenience method for save confirmations
    async confirmSave(itemName) {
        return await this.show({
            title: 'Salvar Alterações',
            message: `Deseja salvar as alterações em "${itemName}"?`,
            confirmText: 'Salvar',
            cancelText: 'Cancelar',
            type: 'info'
        });
    }
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes scale-in {
        from {
            transform: scale(0.95);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    .animate-scale-in {
        animation: scale-in 0.2s ease-out;
    }
`;
document.head.appendChild(style);

// Make globally available
window.ConfirmModal = ConfirmModal;
