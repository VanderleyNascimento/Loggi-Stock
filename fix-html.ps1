# Script to add Materials view to index.html
$content = Get-Content "index.html.temp" -Raw

# Define the Materials view HTML
$materialsView = @"

        <!-- Materials View -->
        <div id="view-materials" class="hidden space-y-6">
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Material
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Estoque
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Mínimo
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Status
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Tipo
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody id="materials-table" class="divide-y divide-slate-100">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
"@

# Insert Materials view after Analytics view (before Modal: Scanner comment)
$content = $content -replace '(        </div>\r\n        </div>\r\n\r\n        <!-- Modal: Scanner -->)', "$materialsView`r`n`$1"

# Add QRCode.js library after Chart.js
$content = $content -replace '(    <!-- Chart.js for Analytics -->\r\n    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>\r\n\r\n    <!-- Custom Styles -->)', "`$1`r`n`r`n    <!-- QRCode.js for QR Code Generation -->`r`n    <script src=`"https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`"></script>`r`n"

# Add qrcode-manager.js script before app.js
$content = $content -replace '(        <script src="js/scanner.js"></script>\r\n        <script src="js/app.js"></script>)', "        <script src=`"js/scanner.js`"></script>`r`n        <script src=`"js/qrcode-manager.js`"></script>`r`n        <script src=`"js/app.js`"></script>"

# Save to index.html
$content | Set-Content "index.html" -NoNewline

Write-Host "✅ index.html updated successfully with Materials view and QR Code libraries!"
