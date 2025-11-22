// MNIST Training Dashboard - Real-time Data Fetcher
// Fetches and displays training insights, test results, and model performance

class TrainingDashboard {
    constructor() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.metricsGrid = document.querySelector('.metrics-grid');
        this.lossChart = document.getElementById('lossChart');
        this.accChart = document.getElementById('accuracyChart');
        this.predictionsGrid = document.getElementById('predictionsGrid');
        this.imagesGrid = document.getElementById('imagesGrid');
        this.statusBadge = document.getElementById('trainingStatus');
        this.lastUpdateElem = document.getElementById('lastUpdate');
        this.state = {
            testAccuracy: null,
            testLoss: null,
            totalEpochs: null,
            finalTrainAccuracy: null,
        };
        this.predictionData = [];
        this.maxSampleImages = 5;
        this.refreshTimer = null;
        this.refreshIntervalMs = 300000; // 5 minutes
        this.init();
    }

    async init() {
        this.showLoading();
        let outputs = null;
        let trainMD = null;
        let testMD = null;
        let dataLoaded = false;
        try {
            // Try outputs.txt first
            try {
                const text = await this.fetchText('outputs.txt');
                outputs = this.parseKV(text);
            } catch (err) {
                // Ignore missing outputs.txt
            }

            // Always try to load markdowns
            try {
                [trainMD, testMD] = await Promise.all([
                    this.fetchText('train_output.md'),
                    this.fetchText('test_output.md'),
                ]);
            } catch (err) {
                // If markdowns missing, fail
                throw new Error('Missing training or test markdown');
            }

            // If outputs.txt present, use it for metrics and predictions
            if (outputs) {
                this.applyOutputs(outputs);
                dataLoaded = true;
            }
            // Always parse markdowns for images and fallback metrics
            if (trainMD && testMD) {
                this.parseTraining(trainMD);
                this.parseTest(testMD);
                this.renderImagesFromMarkdown(testMD);
                dataLoaded = true;
            }

            this.renderMetrics();
            this.renderCharts(outputs);
            if (this.statusBadge) {
                this.statusBadge.textContent = dataLoaded ? 'Data Loaded' : 'No Data';
                this.statusBadge.classList.toggle('error', !dataLoaded);
            }
            this.updateLastUpdateTime();
        } catch (err) {
            console.error('Init error:', err);
            this.failBadge('Data Load Error');
            this.setLastUpdateFallback();
        }
            // Always hide preloader after 3 seconds, regardless of data loading
            setTimeout(() => {
                this.hideLoading();
            }, 3000);
        this.startAutoRefresh();
    }

    async fetchText(path) {
        const resp = await fetch(path, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`Failed to fetch ${path}`);
        return resp.text();
    }

    showLoading() { if (this.loadingOverlay) this.loadingOverlay.classList.add('show'); }
    hideLoading() { if (this.loadingOverlay) this.loadingOverlay.classList.remove('show'); }
    failBadge(text) { if (this.statusBadge) { this.statusBadge.textContent = text; this.statusBadge.classList.add('error'); } }

    parseTraining(md) {
        const lines = md.split('\n');
        const rows = [];
        md.split('\n').forEach(line => {
            const match = line.match(/^\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/);
            if (match) {
                rows.push({ epoch: parseInt(match[1], 10), accuracy: parseFloat(match[3]) });
            }
        });
        if (rows.length) {
            this.state.totalEpochs = rows.length;
            const last = rows[rows.length - 1];
            if (!Number.isNaN(last.accuracy)) {
                this.state.finalTrainAccuracy = last.accuracy;
            }
        } else if (this.state.totalEpochs == null) {
            this.state.totalEpochs = 15;
        }
    }

    parseTest(md) {
        const accMatch = md.match(/Test\s*Accuracy\*\*:\s*([\d.]+)/i);
        const lossMatch = md.match(/Test\s*Loss\*\*:\s*([\d.]+)/i);
        this.state.testAccuracy = accMatch ? parseFloat(accMatch[1]) : null;
        this.state.testLoss = lossMatch ? parseFloat(lossMatch[1]) : null;

        // predictions table
        const lines = md.split('\n');
        const preds = [];
        lines.forEach(line => {
            const match = line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/);
            if (match) {
                const idx = parseInt(match[1], 10);
                const t = parseInt(match[2], 10);
                const p = parseInt(match[3], 10);
                preds.push({ index: idx, true_label: t, predicted_label: p, correct: t === p });
            }
        });
        if (preds.length) {
            this.predictionData = preds;
            this.renderPredictions(preds);
        }
    }

    renderMetrics() {
        if (!this.metricsGrid) return;
        const fmtPct = v => v == null ? '—' : `${(v * 100).toFixed(1)}%`;
        const totalEpochs = this.state.totalEpochs ?? 15;
        const fmtNum = v => `${v}`;
        const data = [
            { label: 'Test Accuracy', value: fmtPct(this.state.testAccuracy), id: 'testAccuracy' },
            { label: 'Test Loss', value: this.state.testLoss == null ? '—' : this.state.testLoss.toFixed(4), id: 'testLoss' },
            { label: 'Training Epochs', value: fmtNum(totalEpochs), id: 'totalEpochs' },
            { label: 'Final Train Accuracy', value: fmtPct(this.state.finalTrainAccuracy), id: 'finalTrainAccuracy' },
        ];
        this.metricsGrid.innerHTML = '';
        data.forEach(m => {
            const card = document.createElement('div');
            card.className = 'metric-card';
            card.innerHTML = `
                <div class="metric-content">
                    <div class="metric-label">${m.label}</div>
                    <div class="metric-value" id="${m.id}">${m.value}</div>
                </div>
            `;
            this.metricsGrid.appendChild(card);
        });
    }

    renderCharts(outputs) {
        const ensureImg = (container, src, alt) => {
            if (!container) return;
            container.innerHTML = '';
            const img = document.createElement('img');
            img.className = 'chart-image';
            img.src = src;
            img.alt = alt;
            img.onerror = () => { container.innerHTML = '<div class="chart-error">Chart not available</div>'; };
            container.appendChild(img);
        };
        const lossSrc = outputs?.train_loss_image || 'images/train_loss.png';
        const accSrc = outputs?.train_accuracy_image || 'images/train_accuracy.png';
        ensureImg(this.lossChart, lossSrc, 'Training Loss');
        ensureImg(this.accChart, accSrc, 'Training Accuracy');
    }

    parseKV(text) {
        const lines = text.split('\n');
        const kv = {};
        for (const line of lines) {
            const idx = line.indexOf('=');
            if (idx > 0) {
                const k = line.slice(0, idx).trim();
                const v = line.slice(idx + 1).trim();
                kv[k] = v;
            }
        }
        return kv;
    }

    applyOutputs(kv) {
        const num = x => (x === undefined || x === '' ? null : parseFloat(x));
        if (kv.total_epochs) this.state.totalEpochs = parseInt(kv.total_epochs, 10);
        if (kv.final_train_accuracy !== undefined) this.state.finalTrainAccuracy = num(kv.final_train_accuracy);
        if (kv.test_accuracy !== undefined) this.state.testAccuracy = num(kv.test_accuracy);
        if (kv.test_loss !== undefined) this.state.testLoss = num(kv.test_loss);

        // Render predictions stub if we have per-sample labels
        const preds = [];
        for (let i = 1; i <= 8; i++) {
            const t = kv[`sample_${String(i).padStart(2, '0')}_true`];
            const p = kv[`sample_${String(i).padStart(2, '0')}_pred`];
            if (t !== undefined && p !== undefined) {
                const ti = parseInt(t, 10);
                const pi = parseInt(p, 10);
                preds.push({ index: i, true_label: ti, predicted_label: pi, correct: ti === pi });
            }
        }
        if (preds.length) {
            this.predictionData = preds;
            this.renderPredictions(preds);
        }

        // Render sample images directly if provided
        const grid = this.imagesGrid;
        if (grid && kv.sample_images) {
            grid.innerHTML = '';
            const parts = kv.sample_images.split(',').map(s => s.trim()).filter(Boolean);
            parts.forEach((src, idx) => {
                const card = document.createElement('div');
                card.className = 'image-card';
                card.innerHTML = `<img src="${src}" alt="sample"><div class="image-caption">Sample ${String(idx+1).padStart(2,'0')}</div>`;
                grid.appendChild(card);
            });
        }
    }

    renderPredictions(preds) {
        const grid = this.predictionsGrid;
        if (!grid) return;
        const data = preds && preds.length ? preds : this.predictionData;
        grid.innerHTML = '';
        if (!data || data.length === 0) {
            grid.innerHTML = '<div class="no-data">No prediction data available</div>';
            return;
        }
        data.slice(0, 8).forEach(pred => {
            const div = document.createElement('div');
            div.className = `prediction-item ${pred.correct ? 'correct' : 'incorrect'}`;
            div.innerHTML = `
                <div class="prediction-header">
                    <span class="prediction-id">#${pred.index}</span>
                    <span class="prediction-status">${pred.correct ? 'Correct' : 'Wrong'}</span>
                </div>
                <div class="prediction-body">
                    <span class="prediction-true">True: ${pred.true_label}</span>
                    <span class="prediction-pred">Pred: ${pred.predicted_label}</span>
                </div>
            `;
            grid.appendChild(div);
        });
    }

    renderImagesFromMarkdown(md) {
        const grid = this.imagesGrid;
        if (!grid) return;
        grid.innerHTML = '';
        const imgLines = md.split('\n').filter(l => /!\[[^\]]*\]\((images\/[^)]+)\)/.test(l));
        if (imgLines.length === 0) {
            grid.innerHTML = '<div class="no-data">No images listed</div>';
            return;
        }
        imgLines.slice(0, this.maxSampleImages).forEach(line => {
            const match = line.match(/!\[[^\]]*\]\((images\/[^)]+)\).*True:\s*(\d+)\D+Pred:\s*(\d+)/i);
            const src = match ? match[1] : null;
            const t = match ? parseInt(match[2], 10) : null;
            const p = match ? parseInt(match[3], 10) : null;
            const trueLabel = Number.isInteger(t) ? t : '—';
            const predLabel = Number.isInteger(p) ? p : '—';
            const card = document.createElement('div');
            card.className = 'image-card';
            card.innerHTML = src ? `
                <img src="${src}" alt="sample" onerror="this.replaceWith(document.createTextNode('Image missing'))">
                <div class="image-caption">True: ${trueLabel} · Pred: ${predLabel}</div>
            ` : '<div class="image-caption">Image reference invalid</div>';
            grid.appendChild(card);
        });
    }

    startAutoRefresh() {
        if (this.refreshTimer) return;
        this.refreshTimer = setInterval(() => this.init(), this.refreshIntervalMs);
    }

    async updateLastUpdateTime() {
        if (!this.lastUpdateElem) return;
        try {
            const resp = await fetch('train_output.md', { method: 'HEAD', cache: 'no-store' });
            if (!resp.ok) throw new Error('Failed to fetch headers');
            const lastMod = resp.headers.get('last-modified');
            if (lastMod) {
                const date = new Date(lastMod);
                if (!Number.isNaN(date.getTime())) {
                    this.lastUpdateElem.textContent = date.toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    });
                    return;
                }
            }
            this.setLastUpdateFallback();
        } catch (err) {
            console.warn('Last update fetch failed', err);
            this.setLastUpdateFallback();
        }
    }

    setLastUpdateFallback() {
        if (!this.lastUpdateElem) return;
        this.lastUpdateElem.textContent = 'Unavailable';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TrainingDashboard();
});