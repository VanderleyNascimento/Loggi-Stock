// Charts Module - Chart.js Visualizations
// =====================================

const Charts = {
    instances: {},

    // Destroy existing chart before creating new one
    destroyChart(chartId) {
        if (this.instances[chartId]) {
            this.instances[chartId].destroy();
            delete this.instances[chartId];
        }
    },

    // Critical Items Bar Chart - Shows items with BIGGEST DEFICIT (most urgently need restock)
    renderCriticalItems(stock) {
        this.destroyChart('critical');

        // Calculate deficit for each item and filter critical ones
        const criticalWithDeficit = stock
            .filter(i => i.estoqueAtual < i.estoqueCritico) // Below minimum
            .map(i => ({
                ...i,
                deficit: i.estoqueCritico - i.estoqueAtual, // How many units missing
                percentDeficit: ((i.estoqueCritico - i.estoqueAtual) / i.estoqueCritico * 100) // Percentage below
            }))
            .sort((a, b) => b.deficit - a.deficit) // Sort by biggest deficit first
            .slice(0, 8); // Show top 8 most critical

        if (criticalWithDeficit.length === 0) {
            const container = document.getElementById('chart-critical').parentElement;
            container.innerHTML = '<p class="text-sm text-slate-500 text-center py-8">✅ Nenhum item abaixo do estoque mínimo!</p>';
            return;
        }

        const ctx = document.getElementById('chart-critical').getContext('2d');
        this.instances.critical = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: criticalWithDeficit.map(i => i.material),
                datasets: [
                    {
                        label: 'Estoque Atual',
                        data: criticalWithDeficit.map(i => i.estoqueAtual),
                        backgroundColor: '#EF4444',
                        borderColor: '#DC2626',
                        borderWidth: 2,
                    },
                    {
                        label: 'Falta para Mínimo',
                        data: criticalWithDeficit.map(i => i.deficit),
                        backgroundColor: '#F59E0B',
                        borderColor: '#D97706',
                        borderWidth: 2,
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 10,
                            font: {
                                size: 11,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            afterLabel: function (context) {
                                const item = criticalWithDeficit[context.dataIndex];
                                return `Déficit: ${item.deficit} unidades (${Math.round(item.percentDeficit)}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        title: {
                            display: true,
                            text: 'Quantidade',
                            font: {
                                size: 11,
                                weight: '600'
                            }
                        }
                    },
                    y: {
                        stacked: true,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    // Stock Status Pie Chart
    renderStockStatus(stock) {
        this.destroyChart('status');

        const critical = stock.filter(i => i.estoqueAtual <= i.estoqueCritico).length;
        const warning = stock.filter(i => i.estoqueAtual > i.estoqueCritico && i.estoqueAtual <= i.estoqueCritico * 1.5).length;
        const ok = stock.filter(i => i.estoqueAtual > i.estoqueCritico * 1.5).length;

        const ctx = document.getElementById('chart-status').getContext('2d');
        this.instances.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Crítico', 'Atenção', 'OK'],
                datasets: [{
                    data: [critical, warning, ok],
                    backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },
    // Stock Comparison Chart - Mobile Responsive with Scroll
    renderStockComparison(stock) {
        this.destroyChart('comparison');

        const sortedStock = [...stock].sort((a, b) => b.estoqueAtual - a.estoqueAtual);
        const canvas = document.getElementById('chart-comparison');

        // Check if mobile
        const isMobile = window.innerWidth < 768;

        // Calculate width based on number of items
        const barWidth = isMobile ? 40 : 60; // Slightly smaller bars
        const minChartWidth = isMobile ? 600 : 800;
        const calculatedWidth = Math.max(minChartWidth, sortedStock.length * barWidth);

        // Target the inner wrapper div
        const chartBody = document.getElementById('chart-comparison-body');

        // Set explicit dimensions on the wrapper
        if (chartBody) {
            chartBody.style.width = `${calculatedWidth}px`;
            chartBody.style.height = isMobile ? '400px' : '500px';
        }

        // Reset canvas to fill the wrapper
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        // Reset internal dimensions
        canvas.width = calculatedWidth;
        canvas.height = isMobile ? 400 : 500;

        const ctx = canvas.getContext('2d');
        this.instances.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedStock.map(i => i.material),
                datasets: [
                    {
                        label: 'Estoque Atual',
                        data: sortedStock.map(i => i.estoqueAtual),
                        backgroundColor: '#3B82F6',
                        borderColor: '#2563EB',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        barThickness: isMobile ? 20 : 35,
                    },
                    {
                        label: 'Estoque Crítico',
                        data: sortedStock.map(i => i.estoqueCritico),
                        backgroundColor: '#EF4444',
                        borderColor: '#DC2626',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        barThickness: isMobile ? 20 : 35,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: isMobile ? 11 : 13,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        borderColor: '#3B82F6',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: isMobile ? 10 : 12,
                                weight: '500'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: isMobile ? 9 : 11,
                                weight: '500'
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },

    // Movement Timeline Chart - Mobile Responsive with Scroll
    renderMovementTimeline(movements, stock, period = 30) {
        this.destroyChart('timeline');

        const filterPeriod = parseInt(document.getElementById('filter-period')?.value || period);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filterPeriod);

        const validMovements = [];
        let minDate = new Date();
        let maxDate = new Date(0);

        // 1. Parse and filter movements first
        movements.forEach(mov => {
            let movDate;
            if (typeof mov.dataHora === 'string' && mov.dataHora.includes('/')) {
                const normalizedDateTime = mov.dataHora.replace(',', '');
                const [datePart, timePart] = normalizedDateTime.split(' ');
                const [day, month, year] = datePart.split('/');
                movDate = new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}`);
            } else {
                movDate = new Date(mov.dataHora);
            }

            if (isNaN(movDate.getTime())) return;

            if (movDate >= cutoffDate && (mov.tipoOperacao === 'Retirada' || mov.tipoOperacao === 'Saída')) {
                validMovements.push({ ...mov, parsedDate: movDate });
                if (movDate < minDate) minDate = movDate;
                if (movDate > maxDate) maxDate = movDate;
            }
        });

        // 2. Determine granularity
        const timeSpanHours = (maxDate - minDate) / (1000 * 60 * 60);
        const useHourly = timeSpanHours <= 48 && validMovements.length > 0;

        const materialMovements = {};
        const allDates = new Set();

        // 3. Aggregate
        validMovements.forEach(mov => {
            let dateKey;
            if (useHourly) {
                // DD/MM HH:00
                dateKey = mov.parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
                    ' ' + mov.parsedDate.getHours().toString().padStart(2, '0') + 'h';
            } else {
                // DD/MM/YYYY
                dateKey = mov.parsedDate.toLocaleDateString('pt-BR');
            }

            allDates.add(dateKey);

            if (!materialMovements[mov.material]) {
                materialMovements[mov.material] = {};
            }
            if (!materialMovements[mov.material][dateKey]) {
                materialMovements[mov.material][dateKey] = 0;
            }
            materialMovements[mov.material][dateKey] += parseInt(mov.quantidade) || 0;
        });

        // Show message if no data available
        if (allDates.size === 0) {
            const canvas = document.getElementById('chart-timeline');
            const container = canvas.parentElement.parentElement;
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-sm text-slate-500 mb-2">
                        📭 Nenhuma movimentação de retirada encontrada no período selecionado (últimos ${filterPeriod} dias).
                    </p>
                    <button onclick="document.getElementById('filter-period').value='30'; Charts.renderMovementTimeline(window.movementsData, window.stockData, 30);" 
                        class="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        Tentar com 30 dias
                    </button>
                </div>`;
            return;
        }

        const dates = Array.from(allDates).sort((a, b) => {
            if (useHourly) {
                // Format: DD/MM HH:00h
                // We need to parse this back to compare, or just rely on string comparison if format is consistent
                // Better to parse roughly
                const [datePart, timePart] = a.split(' ');
                const [dayA, monthA] = datePart.split('/');
                const hourA = parseInt(timePart);

                const [datePartB, timePartB] = b.split(' ');
                const [dayB, monthB] = datePartB.split('/');
                const hourB = parseInt(timePartB);

                // Compare months, then days, then hours
                if (monthA !== monthB) return monthA - monthB;
                if (dayA !== dayB) return dayA - dayB;
                return hourA - hourB;
            } else {
                // Format: DD/MM/YYYY
                const [dA, mA, yA] = a.split('/');
                const [dB, mB, yB] = b.split('/');
                return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
            }
        });

        const colorPalette = [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
            '#F43F5E', '#06B6D4', '#8B5CF6', '#D946EF', '#0EA5E9'
        ];

        const allMaterials = Object.keys(materialMovements)
            .map(material => ({
                material,
                total: Object.values(materialMovements[material]).reduce((a, b) => a + b, 0)
            }))
            .sort((a, b) => b.total - a.total);

        const datasets = allMaterials.map((item, idx) => {
            const material = item.material;
            return {
                label: material,
                data: dates.map(date => materialMovements[material][date] || 0),
                borderColor: colorPalette[idx % colorPalette.length],
                backgroundColor: colorPalette[idx % colorPalette.length],
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false,
                showLine: true,
                spanGaps: true,
                hidden: idx >= 10 // Hide items after top 10 by default
            };
        });

        const ctx = document.getElementById('chart-timeline').getContext('2d');

        // Destroy existing chart if any
        if (this.instances.timeline) {
            this.instances.timeline.destroy();
        }

        this.instances.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Disable default legend
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#1e293b',
                        bodyColor: '#475569',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 10,
                        boxPadding: 4
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade de Retiradas'
                        },
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });

        window.timelineChartInstance = this.instances.timeline;

        // Generate Custom HTML Legend
        this.generateHtmlLegend(this.instances.timeline, 'chart-timeline-legend');
    },

    // Helper to generate custom HTML legend
    generateHtmlLegend(chart, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = ''; // Clear existing

        const items = chart.data.datasets.map((dataset, index) => {
            const isHidden = !chart.isDatasetVisible(index);
            const color = dataset.borderColor;

            const item = document.createElement('div');
            item.className = `flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer border transition-all ${isHidden ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`;
            item.onclick = () => {
                chart.setDatasetVisibility(index, !chart.isDatasetVisible(index));
                chart.update();
                this.generateHtmlLegend(chart, containerId); // Re-render legend to update styles
            };

            const box = document.createElement('div');
            box.className = 'w-3 h-3 rounded-full';
            box.style.backgroundColor = color;
            if (isHidden) box.style.backgroundColor = '#cbd5e1';

            const text = document.createElement('span');
            text.className = `text-xs font-medium ${isHidden ? 'text-slate-700' : 'text-slate-900'}`;
            text.textContent = dataset.label;

            item.appendChild(box);
            item.appendChild(text);
            return item;
        });

        items.forEach(item => container.appendChild(item));
    },

    // EPI Compliance Chart
    renderEPICompliance(stock) {
        this.destroyChart('epi');

        // Check if element exists before rendering
        const canvas = document.getElementById('chart-epi');
        if (!canvas) {
            console.warn('chart-epi canvas not found, skipping EPI chart');
            return;
        }

        const epis = stock.filter(i => i.epiAtivo === 'Sim' || i.epiAtivo == 1);
        const epiCritical = epis.filter(i => i.estoqueAtual <= i.estoqueCritico).length;
        const epiOk = epis.length - epiCritical;

        const ctx = canvas.getContext('2d');
        this.instances.epi = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['EPIs OK', 'EPIs Críticos'],
                datasets: [{
                    data: [epiOk, epiCritical],
                    backgroundColor: ['#8B5CF6', '#EF4444'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // Top 5 Most Moved Items
    renderTop5Items(stock) {
        this.destroyChart('top5');

        // Check if element exists before rendering
        const canvas = document.getElementById('chart-top5');
        if (!canvas) {
            console.warn('chart-top5 canvas not found, skipping Top 5 chart');
            return;
        }

        const sorted = [...stock].sort((a, b) =>
            (parseInt(b.qtdRetiradas) || 0) - (parseInt(a.qtdRetiradas) || 0)
        ).slice(0, 5);

        const ctx = canvas.getContext('2d');
        this.instances.top5 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(i => i.material),
                datasets: [{
                    label: 'Total de Retiradas',
                    data: sorted.map(i => parseInt(i.qtdRetiradas) || 0),
                    backgroundColor: '#8B5CF6',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Render all analytics charts
    renderAllAnalytics(stock, movements) {
        this.renderStockComparison(stock);
        this.renderMovementTimeline(movements, stock);
        // Note: EPI and Top5 charts are only on Dashboard, not Analytics
    }
};

// Global function to toggle all items in timeline
function toggleAllTimelineItems() {
    if (!window.timelineChartInstance) return;

    const chart = window.timelineChartInstance;
    const btn = document.getElementById('btn-toggle-all');

    // Check if all datasets are currently hidden
    const allHidden = chart.data.datasets.every(dataset => {
        const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(dataset));
        return meta.hidden === true;
    });

    // Toggle all datasets
    chart.data.datasets.forEach((dataset, index) => {
        const meta = chart.getDatasetMeta(index);
        meta.hidden = !allHidden;
    });

    chart.update();

    // Update button text
    if (btn) {
        btn.textContent = allHidden ? 'Desselecionar Todos' : 'Selecionar Todos';
    }
}

window.Charts = Charts;
