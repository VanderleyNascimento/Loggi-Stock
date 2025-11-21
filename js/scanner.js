// QR Code Scanner
// =====================================

let html5QrCode = null;

const Scanner = {

    start() {
        const modal = document.getElementById('modal-scanner');
        modal.classList.remove('hidden');

        html5QrCode = new Html5Qrcode("reader");
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            Scanner.onScanSuccess
        ).catch(err => {
            console.error("Scanner error:", err);
            Components.showToast('Erro ao iniciar câmera. Use o input manual.', 'error');
        });
    },

    stop() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop()
                .then(() => html5QrCode.clear())
                .catch(err => console.error("Stop error:", err));
        }
        document.getElementById('modal-scanner').classList.add('hidden');
    },

    onScanSuccess(decodedText) {
        Scanner.stop();
        Scanner.searchAndOpenItem(decodedText);
    },

    searchAndOpenItem(searchText) {
        if (!window.stockData) {
            Components.showToast('Dados não carregados', 'error');
            return;
        }

        const item = window.stockData.find(i =>
            i.material.toLowerCase().trim() === searchText.toLowerCase().trim()
        );

        if (item) {
            Components.showMovementModal(item);
        } else {
            Components.showToast(`Item "${searchText}" não encontrado`, 'warning');
        }
    }
};
