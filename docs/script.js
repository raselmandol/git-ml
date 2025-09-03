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
        this.state = {
            testAccuracy: null,
            testLoss: null,
            totalEpochs: null,
            finalTrainAccuracy: null,
        };
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
        } catch (err) {
            console.error('Init error:', err);
            this.failBadge('Data Load Error');
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
        const rows = lines.filter(l => l.includes('|') && !l.includes('---') && !/^#/.test(l.trim()) && !/Epoch\s*\|/i.test(l));
        this.state.totalEpochs = rows.length || null;
        if (rows.length) {
            const last = rows[rows.length - 1].split('|').map(s => s.trim()).filter(Boolean);
            if (last.length >= 3) {
                const acc = parseFloat(last[2]);
                if (!Number.isNaN(acc)) this.state.finalTrainAccuracy = acc;
            }
        }
    }

    parseTest(md) {
        const accMatch = md.match(/Test\s*Accuracy\*\*:\s*([\d.]+)/i);
        const lossMatch = md.match(/Test\s*Loss\*\*:\s*([\d.]+)/i);
        this.state.testAccuracy = accMatch ? parseFloat(accMatch[1]) : null;
        this.state.testLoss = lossMatch ? parseFloat(lossMatch[1]) : null;

        // predictions table
        const lines = md.split('\n');
        const predRows = lines.filter(line => /^\|\s*\d+\s*\|\s*\d+\s*\|\s*\d+\s*\|/i.test(line)).slice(0, 8);
        const preds = predRows.map(r => {
            const cells = r.split('|').map(c => c.trim()).filter(Boolean);
            const idx = parseInt(cells[0], 10);
            const t = parseInt(cells[1], 10);
            const p = parseInt(cells[2], 10);
            return { index: idx, true_label: t, predicted_label: p, correct: t === p };
        });
        this.renderPredictions(preds);
    }

    renderMetrics() {
        if (!this.metricsGrid) return;
        const fmtPct = v => v == null ? '—' : `${(v * 100).toFixed(1)}%`;
        const fmtNum = v => v == null ? '—' : `${v}`;
        const data = [
            { label: 'Test Accuracy', value: fmtPct(this.state.testAccuracy), id: 'testAccuracy' },
            { label: 'Test Loss', value: this.state.testLoss == null ? '—' : this.state.testLoss.toFixed(4), id: 'testLoss' },
            { label: 'Total Epochs', value: fmtNum(this.state.totalEpochs), id: 'totalEpochs' },
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
        // Optional: render test accuracy image above images grid
        const testAccImg = document.createElement('img');
        testAccImg.src = outputs?.test_accuracy_image || 'images/test_accuracy.png';
        testAccImg.alt = 'Test Accuracy';
        testAccImg.className = 'chart-image';
        testAccImg.style.maxWidth = '320px';
        testAccImg.onerror = () => { testAccImg.remove(); };
        const section = document.querySelector('.sample-images h2');
        if (section && section.parentElement) {
            section.parentElement.insertBefore(testAccImg, section.nextSibling);
        }
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
        this.state.totalEpochs = kv.total_epochs ? parseInt(kv.total_epochs, 10) : null;
        this.state.finalTrainAccuracy = num(kv.final_train_accuracy);
        this.state.testAccuracy = num(kv.test_accuracy);
        this.state.testLoss = num(kv.test_loss);

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
        if (preds.length) this.renderPredictions(preds);

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
        grid.innerHTML = '';
        if (!preds || preds.length === 0) {
            grid.innerHTML = '<div class="no-data">No prediction data available</div>';
            return;
        }
        preds.forEach(pred => {
            const div = document.createElement('div');
            div.className = `prediction-item ${pred.correct ? 'correct' : 'incorrect'}`;
            div.innerHTML = `
                <div class="prediction-digit">${pred.predicted_label}</div>
                <div class="prediction-labels">True: ${pred.true_label}<br>${pred.correct ? 'Correct' : 'Wrong'}</div>
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

    startAutoRefresh() {
        setInterval(() => this.init(), 300000); // 5 minutes
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TrainingDashboard();
});
