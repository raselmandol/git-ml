// MNIST Training Dashboard - Real-time Data Fetcher
// Fetches and displays training insights, test results, and model performance

class TrainingDashboard {
    constructor() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.init();
    }

    async init() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadTrainingData(),
                this.loadTestData(),
                this.updateLastModified()
            ]);
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        } finally {
            this.hideLoading();
            this.startAutoRefresh();
        }
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('show');
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
        }
    }

    async loadTrainingData() {
        try {
            const response = await fetch('train_output.md');
            if (!response.ok) throw new Error('Failed to fetch training data');
            
            const text = await response.text();
            this.parseTrainingMetrics(text);
            
            // Update status badge
            const statusElement = document.getElementById('trainingStatus');
            if (statusElement) {
                statusElement.textContent = 'Data Loaded';
            }
        } catch (error) {
            console.warn('Could not load training data:', error);
            this.handleDataLoadError('training');
        }
    }

    async loadTestData() {
        try {
            const response = await fetch('test_output.md');
            if (!response.ok) throw new Error('Failed to fetch test data');
            
            const text = await response.text();
            this.parseTestResults(text);
        } catch (error) {
            console.warn('Could not load test data:', error);
            this.handleDataLoadError('test');
        }
    }

    parseTrainingMetrics(markdownText) {
        try {
            // Extract metrics from markdown table
            const lines = markdownText.split('\n');
            const tableRows = lines.filter(line => 
                line.includes('|') && 
                !line.includes('---') && 
                !line.includes('Epoch') && 
                line.trim() !== ''
            );
            // MNIST Training Dashboard - Real-time Data Fetcher
            // Fetches and displays training insights, test results, and model performance

            class TrainingDashboard {
                constructor() {
                    this.loadingOverlay = document.getElementById('loadingOverlay');
                    this.init();
                }

                async init() {
                    this.showLoading();
                    try {
                        await Promise.all([
                            this.loadTrainingData(),
                            this.loadTestData(),
                            this.updateLastModified()
                        ]);
                        const statusElement = document.getElementById('trainingStatus');
                        if (statusElement) {
                            statusElement.textContent = 'Data Loaded';
                            statusElement.classList.remove('error');
                        }
                    } catch (error) {
                        console.error('Error initializing dashboard:', error);
                        this.handleDataLoadError('init');
                    } finally {
                        this.hideLoading();
                        this.startAutoRefresh();
                    }
                }

                showLoading() {
                    if (this.loadingOverlay) this.loadingOverlay.classList.add('show');
                }
                hideLoading() {
                    if (this.loadingOverlay) this.loadingOverlay.classList.remove('show');
                }

                async loadTrainingData() {
                    try {
                        const resp = await fetch('train_output.md', { cache: 'no-store' });
                        if (!resp.ok) throw new Error('Failed to fetch train_output.md');
                        const text = await resp.text();
                        this.parseTrainingMetrics(text);
                    } catch (e) {
                        console.warn('Training data load failed:', e);
                        this.handleDataLoadError('training');
                        this.setIfEmpty('finalTrainAccuracy', '—');
                        this.setIfEmpty('totalEpochs', '—');
                    }
                }

                async loadTestData() {
                    try {
                        const resp = await fetch('test_output.md', { cache: 'no-store' });
                        if (!resp.ok) throw new Error('Failed to fetch test_output.md');
                        const text = await resp.text();
                        this.parseTestResults(text);
                        this.extractAndRenderImageList(text);
                    } catch (e) {
                        console.warn('Test data load failed:', e);
                        this.handleDataLoadError('test');
                        this.setIfEmpty('testAccuracy', '—');
                        this.setIfEmpty('testLoss', '—');
                        const grid = document.getElementById('predictionsGrid');
                        if (grid && grid.children.length === 0) {
                            grid.innerHTML = '<div class="no-data">No prediction data found</div>';
                        }
                    }
                }

                handleDataLoadError(dataType) {
                    const status = document.getElementById('trainingStatus');
                    if (status) {
                        status.textContent = 'Data Load Error';
                        status.className = 'badge status error';
                    }
                    if (dataType === 'test') {
                        const grid = document.getElementById('predictionsGrid');
                        if (grid) {
                            grid.innerHTML = '<div class="no-data">Unable to load prediction data</div>';
                        }
                    }
                    this.setPlaceholderValues();
                }

                setIfEmpty(id, value) {
                    const el = document.getElementById(id);
                    if (el && (el.textContent.trim() === '' || /Loading/i.test(el.textContent))) {
                        el.textContent = value;
                    }
                }

                setPlaceholderValues() {
                    const placeholders = ['testAccuracy', 'testLoss', 'totalEpochs', 'finalTrainAccuracy'];
                    placeholders.forEach(id => {
                        const el = document.getElementById(id);
                        if (el && /Loading/i.test(el.textContent)) {
                            el.textContent = '—';
                        }
                    });
                }

                parseTrainingMetrics(md) {
                    const lines = md.split('\n');
                    const rows = lines.filter(line =>
                        line.includes('|') &&
                        !line.includes('---') &&
                        !/^#/.test(line.trim()) &&
                        !/Epoch\s*\|/i.test(line)
                    );
                    if (rows.length === 0) return;

                    const last = rows[rows.length - 1];
                    const cells = last.split('|').map(c => c.trim()).filter(Boolean);
                    if (cells.length >= 3) {
                        const finalAcc = parseFloat(cells[2]);
                        if (!Number.isNaN(finalAcc)) {
                            const el = document.getElementById('finalTrainAccuracy');
                            if (el) el.textContent = `${(finalAcc * 100).toFixed(1)}%`;
                        }
                    }
                    const epochsEl = document.getElementById('totalEpochs');
                    if (epochsEl) epochsEl.textContent = String(rows.length);
                }

                parseTestResults(md) {
                    const accMatch = md.match(/Test\s*Accuracy\*\*:\s*([\d.]+)/i);
                    const lossMatch = md.match(/Test\s*Loss\*\*:\s*([\d.]+)/i);

                    if (accMatch) {
                        const acc = parseFloat(accMatch[1]);
                        const el = document.getElementById('testAccuracy');
                        if (el && !Number.isNaN(acc)) el.textContent = `${(acc * 100).toFixed(1)}%`;
                    }
                    if (lossMatch) {
                        const loss = parseFloat(lossMatch[1]);
                        const el = document.getElementById('testLoss');
                        if (el && !Number.isNaN(loss)) el.textContent = loss.toFixed(4);
                    }

                    // Parse sample predictions table rows
                    const lines = md.split('\n');
                    const predRows = lines.filter(line =>
                        /^\|\s*\d+\s*\|\s*\d+\s*\|\s*\d+\s*\|/i.test(line)
                    ).slice(0, 8);

                    const preds = predRows.map(r => {
                        const cells = r.split('|').map(c => c.trim()).filter(Boolean);
                        const idx = cells[0];
                        const t = parseInt(cells[1], 10);
                        const p = parseInt(cells[2], 10);
                        return { index: idx, true_label: t, predicted_label: p, correct: t === p };
                    });

                    this.renderPredictions(preds);
                }

                extractAndRenderImageList(md) {
                    // Find markdown image lines like: ![Sample n](images/sample_9907_T5_P5.png) True: 5, Pred: 5
                    const imgLines = md.split('\n').filter(l => /!\[[^\]]*\]\((images\/[^)]+)\)/.test(l));
                    const grid = document.getElementById('imagesGrid');
                    if (!grid) return;
                    grid.innerHTML = '';
                    if (imgLines.length === 0) {
                        grid.innerHTML = '<div class="no-data">No images listed</div>';
                        return;
                    }
                    imgLines.forEach(line => {
                        const match = line.match(/!\[[^\]]*\]\((images\/[^)]+)\).*True:\s*(\d)[^\d]+Pred:\s*(\d)/i);
                        const src = match ? match[1] : null;
                        const t = match ? parseInt(match[2], 10) : null;
                        const p = match ? parseInt(match[3], 10) : null;
                        const card = document.createElement('div');
                        card.className = 'image-card';
                        card.innerHTML = src ? `
                            <img src="${src}" alt="sample" onerror="this.replaceWith(document.createTextNode('Image missing'))">
                            <div class="image-caption">True: ${t} · Pred: ${p}</div>
                        ` : '<div class="image-caption">Image reference invalid</div>';
                        grid.appendChild(card);
                    });
                }

                renderPredictions(predictions) {
                    const grid = document.getElementById('predictionsGrid');
                    if (!grid) return;
                    grid.innerHTML = '';
                    if (!predictions || predictions.length === 0) {
                        grid.innerHTML = '<div class="no-data">No prediction data available</div>';
                        return;
                    }
                    for (const pred of predictions) {
                        const div = document.createElement('div');
                        div.className = `prediction-item ${pred.correct ? 'correct' : 'incorrect'}`;
                        div.innerHTML = `
                            <div class="prediction-digit">${pred.predicted_label}</div>
                            <div class="prediction-labels">True: ${pred.true_label}<br>${pred.correct ? 'Correct' : 'Wrong'}</div>
                        `;
                        grid.appendChild(div);
                    }
                }

                async updateLastModified() {
                    try {
                        const resp = await fetch('train_output.md', { method: 'HEAD', cache: 'no-store' });
                        const last = resp.ok ? resp.headers.get('last-modified') : null;
                        const el = document.getElementById('lastUpdate');
                        if (el) el.textContent = last ? new Date(last).toLocaleString() : new Date().toLocaleString();
                    } catch {
                        const el = document.getElementById('lastUpdate');
                        if (el) el.textContent = new Date().toLocaleString();
                    }
                }

                startAutoRefresh() {
                    setInterval(() => {
                        this.loadTrainingData();
                        this.loadTestData();
                        this.updateLastModified();
                    }, 300000);
                }
            }

    // End of TrainingDashboard class
}

    setFallbackValues() {
        const fallbackData = {
            'testAccuracy': '93.0%',
            'testLoss': '0.2529',
            'totalEpochs': '10',
            'finalTrainAccuracy': '92.5%'
        };

        Object.entries(fallbackData).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && element.textContent === 'Loading...') {
                element.textContent = value;
            }
        });
    }

    async updateLastModified() {
        try {
            // Try to get last modified time from train_output.md
            const response = await fetch('train_output.md', { method: 'HEAD' });
            if (response.ok) {
                const lastModified = response.headers.get('last-modified');
                if (lastModified) {
                    const date = new Date(lastModified);
                    const lastUpdateElement = document.getElementById('lastUpdate');
                    if (lastUpdateElement) {
                        lastUpdateElement.textContent = this.formatDate(date);
                    }
                    return;
                }
            }
            
            // Fallback to current time
            const lastUpdateElement = document.getElementById('lastUpdate');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = this.formatDate(new Date());
            }
        } catch (error) {
            console.warn('Could not get last modified time:', error);
            const lastUpdateElement = document.getElementById('lastUpdate');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = 'Unknown';
            }
        }
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    startAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            this.loadTrainingData();
            this.loadTestData();
            this.updateLastModified();
        }, 300000);
    }
}

// Initialize dashboard and chart error handling when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TrainingDashboard();
    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    // Handle chart image loading errors
    const chartImages = document.querySelectorAll('.chart-image');
    chartImages.forEach(img => {
        img.addEventListener('error', function() {
            if (this.parentElement) this.parentElement.innerHTML = '<div class="chart-error">Chart not available</div>';
        });
    });
});