window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawing-canvas');
    const clearButton = document.getElementById('clear-button');
    const predictButton = document.getElementById('predict-button');
    const loading = document.getElementById('loading');
    const display = document.getElementById('prediction-display');
    const barContainer = document.getElementById('prediction-bars');

    class DigitRecognizer {
        constructor(canvas, display, barContainer) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.display = display;
            this.barContainer = barContainer;

            this.modelPath = `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '')}/mnist_model.onnx`;
            this.isDrawing = false;
            this.canvasRect = this.canvas.getBoundingClientRect();
            this.paths = [];
            this.currentPath = [];

            this.init();
        }

        async init() {
            try {
                this.session = await ort.InferenceSession.create(this.modelPath);
                loading.style.display = 'none';
                this.setupCanvas();
                this.setupEvents();
            } catch (error) {
                console.error('Failed to load model:', error);
                loading.textContent = '⚠️ Failed to load model.';
            }
        }

        setupCanvas() {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = Math.max(10, this.canvas.width / 20);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }

        setupEvents() {
            this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
            this.canvas.addEventListener('mousemove', this.draw.bind(this));
            this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
            this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
            this.canvas.addEventListener('touchstart', this.startDrawing.bind(this));
            this.canvas.addEventListener('touchmove', this.draw.bind(this));
            this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        }

        resizeCanvas() {
            const container = this.canvas.parentElement;
            const containerWidth = container.clientWidth;
            const size = Math.min(containerWidth, 320);
            this.canvas.width = size;
            this.canvas.height = size;

            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, size, size);
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = Math.max(10, size / 20);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            const scaleX = size / this.canvasRect.width;
            const scaleY = size / this.canvasRect.height;
            this.redrawPaths(scaleX, scaleY);
            this.canvasRect = this.canvas.getBoundingClientRect();
        }

        redrawPaths(scaleX, scaleY) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.beginPath();
            for (const path of this.paths) {
                for (let i = 0; i < path.length - 1; i++) {
                    const [x1, y1] = path[i];
                    const [x2, y2] = path[i + 1];
                    this.ctx.moveTo(x1 * scaleX, y1 * scaleY);
                    this.ctx.lineTo(x2 * scaleX, y2 * scaleY);
                }
            }
            this.ctx.stroke();
        }

        getPointerPosition(e) {
            if (e.touches) {
                e = e.touches[0];
            }
            const rect = this.canvas.getBoundingClientRect();
            return [e.clientX - rect.left, e.clientY - rect.top];
        }

        startDrawing(e) {
            this.isDrawing = true;
            this.currentPath = [];
            const [x, y] = this.getPointerPosition(e);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.currentPath.push([x, y]);
            e.preventDefault();
        }

        draw(e) {
            if (!this.isDrawing) return;
            const [x, y] = this.getPointerPosition(e);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            this.currentPath.push([x, y]);
            e.preventDefault();
        }

        stopDrawing(e) {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.ctx.closePath();
                if (this.currentPath.length > 0) {
                    this.paths.push(this.currentPath);
                }
                e.preventDefault();
            }
        }

        clearCanvas() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.strokeStyle = '#000000';
            this.paths = [];
            this.currentPath = [];
            this.display.innerHTML = '';
            this.barContainer.innerHTML = '';
        }

        async predict() {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const grayscale = new Float32Array(28 * 28);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 28;
            tempCanvas.height = 28;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(this.canvas, 0, 0, 28, 28);
            const resizedData = tempCtx.getImageData(0, 0, 28, 28).data;

            for (let i = 0; i < 28 * 28; i++) {
                const r = resizedData[i * 4];
                grayscale[i] = 1.0 - r / 255.0;
            }

            const tensor = new ort.Tensor('float32', grayscale, [1, 1, 28, 28]);
            const feeds = { 'Input3': tensor };
            const results = await this.session.run(feeds);
            const output = results['Plus214_Output_0'].data;

            const maxIdx = output.indexOf(Math.max(...output));
            const confidence = output[maxIdx];

            this.displayPrediction({ digit: maxIdx, confidence }, output);
        }

        displayPrediction(prediction, confidences) {
            this.display.innerHTML = `
                <div class="prediction-result">
                    <div class="predicted-digit">${prediction.digit}</div>
                    <div class="prediction-confidence">
                        <span class="prediction-label">Confidence</span>
                        <span class="prediction-value">${(prediction.confidence * 100).toFixed(1)}%</span>
                    </div>
                </div>
            `;

            this.barContainer.innerHTML = '';
            confidences.forEach((conf, digit) => {
                const bar = document.createElement('div');
                bar.classList.add('confidence-bar');

                const label = document.createElement('span');
                label.classList.add('bar-label');
                label.textContent = digit;

                const barInner = document.createElement('div');
                barInner.classList.add('bar');
                barInner.style.width = `${(conf * 100).toFixed(1)}%`;
                if (digit === prediction.digit) {
                    barInner.classList.add('highlight');
                }

                const barValue = document.createElement('span');
                barValue.classList.add('bar-value');
                barValue.textContent = `${(conf * 100).toFixed(1)}%`;

                bar.appendChild(label);
                bar.appendChild(barInner);
                bar.appendChild(barValue);
                this.barContainer.appendChild(bar);
            });
        }
    }

    const recognizer = new DigitRecognizer(canvas, display, barContainer);

    clearButton.addEventListener('click', () => recognizer.clearCanvas());
    predictButton.addEventListener('click', () => recognizer.predict());
});
