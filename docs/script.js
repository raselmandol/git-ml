// MNIST Digit Recognition - Real ONNX Inference Demo
// This script loads the actual ONNX model and performs real inference

class MNISTDemo {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.session = null;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.loadModel();
    }
    
    async loadModel() {
        try {
            this.showLoading('Loading ONNX model...');
            
            // Load the ONNX model
            this.session = await ort.InferenceSession.create('./mnist_model.onnx');
            
            console.log('✅ ONNX model loaded successfully');
            this.hideLoading();
            
            // Update UI to show real model is loaded
            document.querySelector('.header-content p').textContent = 
                'Draw a digit and watch our AI predict it using the real trained model!';
            
        } catch (error) {
            console.error('❌ Failed to load ONNX model:', error);
            this.hideLoading();
            
            // Fallback message
            document.querySelector('.header-content p').textContent = 
                'Model loading failed. Please ensure the ONNX model is available.';
        }
    }
    
    setupCanvas() {
        // Set up canvas properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 15;
        this.ctx.fillStyle = '#ffffff';
        
        // Make canvas responsive
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Clear canvas
        this.clearCanvas();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const size = Math.min(containerWidth, 320);
        
        // Set canvas size
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Adjust line width based on canvas size
        this.ctx.lineWidth = Math.max(10, size / 20);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000000';
        
        // Clear canvas after resize
        this.clearCanvas();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Button events
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCanvas();
            this.clearPrediction();
        });
        
        document.getElementById('predictBtn').addEventListener('click', () => {
            this.predict();
        });
    }
    
    hideOverlay() {
        const overlay = document.getElementById('canvasOverlay');
        if (overlay) overlay.classList.add('hidden');
    }
    
    showOverlay() {
        const overlay = document.getElementById('canvasOverlay');
        if (overlay) overlay.classList.remove('hidden');
    }
    
    clearPrediction() {
        const display = document.getElementById('predictionDisplay');
        const bars = document.getElementById('confidenceBars');
        
        display.innerHTML = `
            <div class="prediction-placeholder">
                <span class="placeholder-text">Draw a digit to see prediction</span>
            </div>
        `;
        bars.innerHTML = '';
    }
    
    async predict() {
        if (!this.session) {
            alert('Model not loaded yet. Please wait...');
            return;
        }
        
        try {
            this.showLoading('Analyzing your drawing...');
            
            // Preprocess the canvas image for the model
            const imageData = this.preprocessImage();
            
            // Create input tensor for ONNX
            const inputTensor = new ort.Tensor('float32', imageData, [1, 1, 28, 28]);
            
            // Run inference
            const results = await this.session.run({ input: inputTensor });
            const output = results.output.data;
            
            // Convert to probabilities using softmax
            const probabilities = this.softmax(Array.from(output));
            
            // Find the predicted digit
            const predictedDigit = probabilities.indexOf(Math.max(...probabilities));
            const confidence = probabilities[predictedDigit];
            
            // Display results
            this.displayPrediction({
                digit: predictedDigit,
                confidence: confidence,
                probabilities: probabilities
            });
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Prediction error:', error);
            this.hideLoading();
            alert('Prediction failed. Please try again.');
        }
    }
    
    preprocessImage() {
        // Get image data from canvas
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Resize to 28x28 and convert to grayscale
        const resized = this.resizeImageData(imageData, this.canvas.width, this.canvas.height, 28, 28);
        
        // Convert to the format expected by the model (normalize to 0-1)
        const normalized = new Float32Array(28 * 28);
        for (let i = 0; i < 28 * 28; i++) {
            // Convert RGBA to grayscale and normalize
            const pixelIndex = i * 4;
            const r = resized[pixelIndex];
            const g = resized[pixelIndex + 1];
            const b = resized[pixelIndex + 2];
            const gray = (r + g + b) / 3;
            
            // Invert colors (black ink on white background -> white ink on black background)
            normalized[i] = (255 - gray) / 255.0;
        }
        
        return normalized;
    }
    
    resizeImageData(imageData, oldWidth, oldHeight, newWidth, newHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Create temporary canvas with original image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = oldWidth;
        tempCanvas.height = oldHeight;
        
        tempCtx.putImageData(imageData, 0, 0);
        
        // Draw resized image
        ctx.drawImage(tempCanvas, 0, 0, oldWidth, oldHeight, 0, 0, newWidth, newHeight);
        
        return ctx.getImageData(0, 0, newWidth, newHeight).data;
    }
    
    softmax(arr) {
        const max = Math.max(...arr);
        const exp = arr.map(x => Math.exp(x - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(x => x / sum);
    }
    
    displayPrediction(prediction) {
        const display = document.getElementById('predictionDisplay');
        
        display.innerHTML = `
            <div class="prediction-result">
                <div class="predicted-digit">${prediction.digit}</div>
                <div class="prediction-confidence">
                    <span class="prediction-label">Confidence</span>
                    <span class="prediction-value">${(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
        
        this.displayConfidenceBars(prediction.probabilities);
    }
    
    displayConfidenceBars(probabilities) {
        const bars = document.getElementById('confidenceBars');
        const maxProb = Math.max(...probabilities);
        
        bars.innerHTML = '';
        
        probabilities.forEach((prob, digit) => {
            const barContainer = document.createElement('div');
            barContainer.className = `confidence-bar ${prob === maxProb ? 'top-prediction' : ''}`;
            
            barContainer.innerHTML = `
                <span class="confidence-digit">${digit}</span>
                <div class="confidence-progress">
                    <div class="confidence-fill" style="width: ${prob * 100}%"></div>
                </div>
                <span class="confidence-value">${(prob * 100).toFixed(1)}%</span>
            `;
            
            bars.appendChild(barContainer);
        });
    }
    
    showLoading(message = 'Loading AI model...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.classList.add('show');
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('show');
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if ONNX Runtime is available
    if (typeof ort === 'undefined') {
        console.error('ONNX Runtime not loaded');
        document.querySelector('.header-content p').textContent = 
            'ONNX Runtime failed to load. Please refresh the page.';
        return;
    }
    
    // Initialize the demo
    new MNISTDemo();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.instruction-item, .info-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
