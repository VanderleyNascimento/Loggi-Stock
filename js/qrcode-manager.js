// QR Code Generation and Management
// This module handles QR code generation, printing, and sharing

// Inject QR Modal HTML into the page
document.addEventListener('DOMContentLoaded', function () {
    const qrModalHTML = `
        <!-- Modal: QR Code Generator -->
        <div id="modal-qr"
            class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <div class="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 class="text-xl font-bold text-slate-900">
                        <i class="fa-solid fa-qrcode mr-2 text-blue-600"></i>QR Code
                    </h3>
                    <button onclick="closeQRModal()"
                        class="text-slate-400 hover:text-slate-600 transition-colors">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                <div class="p-5 space-y-4">
                    <!-- Item Info -->
                    <div class="bg-slate-50 p-3 rounded-lg">
                        <h4 id="qr-item-name" class="text-base font-bold text-slate-900 mb-2 truncate"></h4>
                        <div class="grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <span class="text-slate-500">Estoque:</span>
                                <span id="qr-item-stock" class="font-semibold text-slate-900"></span>
                            </div>
                            <div>
                                <span class="text-slate-500">Mínimo:</span>
                                <span id="qr-item-min" class="font-semibold text-slate-900"></span>
                            </div>
                            <div>
                                <span class="text-slate-500">Tipo:</span>
                                <span id="qr-item-type" class="font-semibold text-slate-900"></span>
                            </div>
                        </div>
                    </div>

                    <!-- QR Code Display -->
                    <div class="flex justify-center bg-white p-2 rounded-lg border-2 border-slate-200">
                        <div id="qr-code-canvas"></div>
                    </div>

                    <!-- Print Layout Selection -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Layout de Impressão</label>
                        <select id="qr-print-layout"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="thermal">Impressora Térmica (58mm)</option>
                            <option value="a4">Papel A4 (6 códigos)</option>
                        </select>
                    </div>

                    <!-- Action Buttons -->
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="printQRCode()"
                            class="py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all text-sm">
                            <i class="fa-solid fa-print mr-2"></i>Imprimir
                        </button>
                        <button onclick="downloadQRCode()"
                            class="py-2.5 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 active:scale-95 transition-all text-sm">
                            <i class="fa-solid fa-download mr-2"></i>Baixar
                        </button>
                    </div>
                    <button onclick="shareQRWhatsApp()"
                        class="w-full py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition-all text-sm">
                        <i class="fa-brands fa-whatsapp mr-2"></i>Compartilhar no WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `;

    // Inject modal into body
    document.body.insertAdjacentHTML('beforeend', qrModalHTML);
});

// This module handles QR code generation, printing, and sharing

const QRCodeManager = {
    currentQRCode: null,
    currentItemName: '',

    // Open QR Code modal and generate QR
    openModal: function (itemIdentifier) {
        // itemIdentifier can be either:
        // - number: item ID
        // - string: item name (for backward compatibility)

        let item;

        if (typeof itemIdentifier === 'number') {
            // Search by ID
            item = window.stockData.find(i => i.id === itemIdentifier);
        } else {
            // Search by name (fallback for old QR codes)
            item = window.stockData.find(i => i.material === itemIdentifier);
        }

        if (!item) {
            alert('Item não encontrado!');
            return;
        }

        // Store current item name for reference
        this.currentItemName = item.material;

        // Update modal content
        document.getElementById('qr-item-name').textContent = item.material;
        document.getElementById('qr-item-stock').textContent = item.estoqueAtual || item.quantidade || 0;
        document.getElementById('qr-item-min').textContent = item.estoqueCritico || item.critico || 0;
        document.getElementById('qr-item-type').textContent = (item.epiAtivo === 'Sim' || item.epiAtivo == 1) ? 'EPI' : 'Material';

        // Clear previous QR code
        document.getElementById('qr-code-canvas').innerHTML = '';

        // Generate new QR code
        this.generateQRCode(item);

        // Show modal
        document.getElementById('modal-qr').classList.remove('hidden');
    },

    // Generate QR Code
    generateQRCode: function (item) {
        const canvas = document.getElementById('qr-code-canvas');

        // Clear previous QR
        canvas.innerHTML = '';

        // Usar ID se disponível, senão usar nome (fallback)
        // Se item for string (nome), usar como está
        const qrData = (typeof item === 'object' && item.id) ? item.id.toString() :
            (typeof item === 'object' ? item.material : item);

        // Generate QR code using QRCode.js
        this.currentQRCode = new QRCode(canvas, {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    },

    // Close modal
    closeModal: function () {
        document.getElementById('modal-qr').classList.add('hidden');
        this.currentQRCode = null;
    },

    // Print QR Code with selected layout
    printQRCode: function () {
        const layout = document.getElementById('qr-print-layout').value;
        const item = window.stockData.find(i => i.material === this.currentItemName);

        if (!item) return;

        // Create print window
        const printWindow = window.open('', '_blank');
        const qrImage = document.querySelector('#qr-code-canvas img').src;

        let htmlContent = '';

        if (layout === 'thermal') {
            // Thermal printer layout (58mm)
            htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>QR Code - ${this.currentItemName}</title>
                    <style>
                        @page {
                            size: 58mm auto;
                            margin: 0;
                        }
                        body {
                            width: 58mm;
                            margin: 0;
                            padding: 5mm;
                            font-family: Arial, sans-serif;
                            text-align: center;
                        }
                        .qr-container {
                            margin: 0 auto;
                        }
                        .qr-code {
                            width: 40mm;
                            height: 40mm;
                            margin: 0 auto 3mm;
                        }
                        .item-name {
                            font-size: 12pt;
                            font-weight: bold;
                            margin-bottom: 2mm;
                            word-wrap: break-word;
                        }
                        .item-info {
                            font-size: 8pt;
                            color: #666;
                        }
                        @media print {
                            body { margin: 0; padding: 5mm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        <img src="${qrImage}" class="qr-code" alt="QR Code">
                        <div class="item-name">${this.currentItemName}</div>
                        <div class="item-info">
                            Estoque: ${item.estoqueAtual || item.quantidade || 0} | Mín: ${item.estoqueCritico || item.critico || 0}
                        </div>
                    </div>
                </body>
                </html>
            `;
        } else {
            // A4 layout (6 QR codes per page)
            const qrCells = Array(6).fill(null).map(() => `
                <div class="qr-cell">
                    <img src="${qrImage}" class="qr-code" alt="QR Code">
                    <div class="item-name">${this.currentItemName}</div>
                    <div class="item-info">
                        Estoque: ${item.estoqueAtual || item.quantidade || 0} | Mín: ${item.estoqueCritico || item.critico || 0} | ${(item.epiAtivo === 'Sim' || item.epiAtivo == 1) ? 'EPI' : 'Material'}
                    </div>
                </div>
            `).join('');

            htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>QR Codes - ${this.currentItemName}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                        }
                        .grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            grid-template-rows: repeat(3, 1fr);
                            gap: 5mm;
                            height: 277mm;
                        }
                        .qr-cell {
                            border: 1px dashed #ccc;
                            padding: 5mm;
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                        }
                        .qr-code {
                            width: 60mm;
                            height: 60mm;
                            margin-bottom: 3mm;
                        }
                        .item-name {
                            font-size: 14pt;
                            font-weight: bold;
                            margin-bottom: 2mm;
                            word-wrap: break-word;
                            max-width: 80mm;
                        }
                        .item-info {
                            font-size: 10pt;
                            color: #666;
                        }
                        @media print {
                            .qr-cell { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="grid">
                        ${qrCells}
                    </div>
                </body>
                </html>
            `;
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for images to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
    },

    // Share via WhatsApp
    shareWhatsApp: function () {
        const message = encodeURIComponent(
            `📦 *${this.currentItemName}*\n\n` +
            `Estoque Atual: ${document.getElementById('qr-item-stock').textContent}\n` +
            `Estoque Mínimo: ${document.getElementById('qr-item-min').textContent}\n\n` +
            `Escaneie o QR Code para identificar este item no sistema LoggiStock.`
        );

        // Open WhatsApp with message
        // Note: QR code image sharing requires downloading first
        window.open(`https://wa.me/?text=${message}`, '_blank');

        // Prompt user to download QR code
        alert('Mensagem enviada! Agora baixe o QR Code e compartilhe a imagem no WhatsApp.');
        this.downloadQRCode();
    },

    // Download QR Code as PNG
    downloadQRCode: function () {
        const qrImage = document.querySelector('#qr-code-canvas img');
        if (!qrImage) {
            alert('QR Code não encontrado!');
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.download = `QR_${this.currentItemName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        link.href = qrImage.src;
        link.click();
    }
};

// Make functions globally accessible
window.openQRModal = (itemName) => QRCodeManager.openModal(itemName);
window.closeQRModal = () => QRCodeManager.closeModal();
window.printQRCode = () => QRCodeManager.printQRCode();
window.shareQRWhatsApp = () => QRCodeManager.shareWhatsApp();
window.downloadQRCode = () => QRCodeManager.downloadQRCode();
