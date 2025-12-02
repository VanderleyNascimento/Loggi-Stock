// QR Code Scanner
// =====================================

let html5QrCode = null;

const Scanner = {

    async start() {
        const modal = document.getElementById('modal-scanner');
        modal.classList.remove('hidden');

        // Show loading state
        const reader = document.getElementById('reader');
        reader.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-white"><i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4"></i><p>Iniciando câmera...</p></div>';

        try {
            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("reader");
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                Scanner.onScanSuccess
            );
        } catch (err) {
            console.error("Scanner error:", err);
            Components.showToast('Erro ao iniciar câmera. Verifique as permissões.', 'error');
            reader.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-white"><i class="fa-solid fa-triangle-exclamation text-4xl mb-4 text-red-500"></i><p>Erro ao acessar câmera</p></div>';
        }
    },

    stop() {
        if (html5QrCode) {
            html5QrCode.stop()
                .then(() => {
                    html5QrCode.clear();
                    html5QrCode = null;
                })
                .catch(err => {
                    console.error("Stop error:", err);
                    html5QrCode = null;
                });
        }
        document.getElementById('modal-scanner').classList.add('hidden');
    },

    onScanSuccess(decodedText) {
        Scanner.stop();
        Scanner.searchAndOpenItem(decodedText);
    },

    searchAndOpenItem(text) {
        const cleanText = text.trim();

        // Tentar buscar por ID primeiro (se for número)
        if (/^\d+$/.test(cleanText)) {
            const item = window.stockData.find(i => i.id === parseInt(cleanText));
            if (item) {
                // Se estiver na aba inventário, adicionar à contagem
                if (window.currentTab === 'inventory' && typeof Inventory !== 'undefined') {
                    Inventory.addItem(item);
                    return;
                }
                // Senão, abrir modal de movimentação
                Components.showMovementModal(item);
                return;
            }
        }

        // Fallback: buscar por nome (compatibilidade com QR codes antigos)
        const item = window.stockData.find(i =>
            i.material.toLowerCase() === cleanText.toLowerCase()
        );

        if (item) {
            // Se estiver na aba inventário, adicionar à contagem
            if (window.currentTab === 'inventory' && typeof Inventory !== 'undefined') {
                Inventory.addItem(item);
                return;
            }
            Components.showMovementModal(item);
        } else {
            Components.showToast('Item não encontrado', 'error');
        }
    }
};

// Initialize close button and manual input
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('scanner-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => Scanner.stop());
    }

    // Manual Input Event Listeners
    const manualInput = document.getElementById('manual-input');
    const manualSearchBtn = document.getElementById('manual-search');

    if (manualSearchBtn && manualInput) {
        const triggerSearch = () => {
            const text = manualInput.value;
            if (text) {
                Scanner.searchAndOpenItem(text);
                manualInput.value = ''; // Clear input after search
            }
        };

        manualSearchBtn.addEventListener('click', triggerSearch);

        manualInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                triggerSearch();
            }
        });
    }
});

window.Scanner = Scanner;
