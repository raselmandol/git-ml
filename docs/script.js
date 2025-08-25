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
        try {
            const [trainMD, testMD] = await Promise.all([
                this.fetchText('train_output.md'),
                this.fetchText('test_output.md'),
            ]);
            this.parseTraining(trainMD);
            this.parseTest(testMD);
            this.renderMetrics();
            this.renderCharts();
            this.renderImagesFromMarkdown(testMD);
            if (this.statusBadge) {
                this.statusBadge.textContent = 'Data Loaded';
                this.statusBadge.classList.remove('error');
            }
        } catch (err) {
            console.error('Init error:', err);
            this.failBadge('Data Load Error');
        } finally {
            this.hideLoading();
            this.startAutoRefresh();
        }
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

    renderCharts() {
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
        ensureImg(this.lossChart, 'images/train_loss.png', 'Training Loss');
        ensureImg(this.accChart, 'images/train_accuracy.png', 'Training Accuracy');
        // Optional: render test accuracy image above images grid
        const testAccImg = document.createElement('img');
        testAccImg.src = 'images/test_accuracy.png';
        testAccImg.alt = 'Test Accuracy';
        testAccImg.className = 'chart-image';
        testAccImg.style.maxWidth = '320px';
        testAccImg.onerror = () => { testAccImg.remove(); };
        const section = document.querySelector('.sample-images h2');
        if (section && section.parentElement) {
            section.parentElement.insertBefore(testAccImg, section.nextSibling);
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
