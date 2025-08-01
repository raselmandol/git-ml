// MNIST Digit Recognition - Interactive Demo
// This script provides a client-side simulation of the trained MNIST model

class MNISTDemo {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Mock model weights for demonstration
        // In a real implementation, you'd load the actual PyTorch model
        this.mockModel = this.initializeMockModel();
        
        this.setupCanvas();
        this.setupEventListeners();
        this.hideLoading();
    }
    
    setupCanvas() {
        // Set up canvas properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 20;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // High DPI support
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
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
        document.getElementById('clearBtn').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('predictBtn').addEventListener('click', this.predict.bind(this));
        
        // Hide overlay when user starts drawing
        this.canvas.addEventListener('mousedown', this.hideOverlay.bind(this));
        this.canvas.addEventListener('touchstart', this.hideOverlay.bind(this));
    }
    
    hideOverlay() {
        const overlay = document.getElementById('canvasOverlay');
        overlay.classList.add('hidden');
    }
    
    showOverlay() {
        const overlay = document.getElementById('canvasOverlay');
        overlay.classList.remove('hidden');
    }
    
    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getEventPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getEventPos(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.showOverlay();
        this.clearPrediction();
    }
    
    clearPrediction() {
        const display = document.getElementById('predictionDisplay');
        display.innerHTML = `
            <div class="prediction-placeholder">
                <span class="placeholder-icon">🎯</span>
                <span class="placeholder-text">Draw a digit to see prediction</span>
            </div>
        `;
        
        const confidenceBars = document.getElementById('confidenceBars');
        confidenceBars.innerHTML = '';
    }
    
    async predict() {
        // Show loading state
        this.showLoading();
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Process canvas image
        const imageData = this.preprocessImage();
        
        // Get prediction from mock model
        const prediction = this.mockPredict(imageData);
        
        // Display results
        this.displayPrediction(prediction);
        
        this.hideLoading();
    }
    
    preprocessImage() {
        // Get image data from canvas
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale and normalize
        const grayscale = [];
        for (let i = 0; i < data.length; i += 4) {
            const gray = 255 - (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            grayscale.push(gray / 255.0);
        }
        
        // Resize to 28x28 (simplified - in reality you'd use proper image processing)
        const resized = this.resizeImage(grayscale, this.canvas.width / window.devicePixelRatio, 28);
        
        return resized;
    }
    
    resizeImage(imageData, originalSize, newSize) {
        // Simplified resizing - just sample every nth pixel
        const ratio = originalSize / newSize;
        const resized = [];
        
        for (let y = 0; y < newSize; y++) {
            for (let x = 0; x < newSize; x++) {
                const sourceX = Math.floor(x * ratio);
                const sourceY = Math.floor(y * ratio);
                const index = sourceY * originalSize + sourceX;
                resized.push(imageData[index] || 0);
            }
        }
        
        return resized;
    }
    
    initializeMockModel() {
        // Initialize a mock model with realistic behavior
        // This simulates the neural network's decision making
        return {
            // Mock weights that favor certain patterns
            weights: Array.from({ length: 784 }, () => Math.random() * 0.1 - 0.05),
            biases: Array.from({ length: 10 }, () => Math.random() * 0.1 - 0.05)
        };
    }
    
    mockPredict(imageData) {
        // Simple pattern matching for demonstration
        // This creates realistic-looking predictions based on basic shape analysis
        
        const predictions = new Array(10).fill(0);
        
        // Analyze image characteristics
        const centerMass = this.calculateCenterMass(imageData);
        const density = this.calculateDensity(imageData);
        const aspectRatio = this.calculateAspectRatio(imageData);
        const topHeavy = this.isTopHeavy(imageData);
        const hasLoop = this.hasLoop(imageData);
        
        // Basic pattern recognition rules
        if (hasLoop && density > 0.3) {
            predictions[0] += 0.4; // 0 has a loop
            predictions[6] += 0.3; // 6 has a loop
            predictions[8] += 0.4; // 8 has loops
            predictions[9] += 0.3; // 9 has a loop
        }
        
        if (density < 0.15) {
            predictions[1] += 0.5; // 1 is thin
            predictions[7] += 0.2; // 7 is relatively thin
        }
        
        if (topHeavy) {
            predictions[2] += 0.3;
            predictions[3] += 0.3;
            predictions[5] += 0.3;
            predictions[7] += 0.4;
        }
        
        if (aspectRatio > 1.2) {
            predictions[1] += 0.4; // 1 is tall
            predictions[7] += 0.3; // 7 is tall
        }
        
        // Add some randomness and ensure realistic distribution
        for (let i = 0; i < 10; i++) {
            predictions[i] += Math.random() * 0.2;
            predictions[i] = Math.max(0, predictions[i]);
        }
        
        // Normalize to probabilities
        const sum = predictions.reduce((a, b) => a + b, 0);
        const normalized = predictions.map(p => p / sum);
        
        // Find top prediction
        const maxIndex = normalized.indexOf(Math.max(...normalized));
        const confidence = normalized[maxIndex];
        
        return {
            digit: maxIndex,
            confidence: confidence,
            probabilities: normalized
        };
    }
    
    calculateCenterMass(imageData) {
        let totalMass = 0;
        let centerX = 0;
        let centerY = 0;
        
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                const pixel = imageData[y * 28 + x];
                totalMass += pixel;
                centerX += x * pixel;
                centerY += y * pixel;
            }
        }
        
        return {
            x: centerX / totalMass,
            y: centerY / totalMass
        };
    }
    
    calculateDensity(imageData) {
        const nonZeroPixels = imageData.filter(p => p > 0.1).length;
        return nonZeroPixels / imageData.length;
    }
    
    calculateAspectRatio(imageData) {
        let minX = 28, maxX = 0, minY = 28, maxY = 0;
        
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                if (imageData[y * 28 + x] > 0.1) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        return height / width;
    }
    
    isTopHeavy(imageData) {
        let topHalf = 0;
        let bottomHalf = 0;
        
        for (let y = 0; y < 14; y++) {
            for (let x = 0; x < 28; x++) {
                topHalf += imageData[y * 28 + x];
            }
        }
        
        for (let y = 14; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                bottomHalf += imageData[y * 28 + x];
            }
        }
        
        return topHalf > bottomHalf * 1.2;
    }
    
    hasLoop(imageData) {
        // Simplified loop detection
        let enclosedRegions = 0;
        
        // Check for enclosed areas (very basic)
        for (let y = 5; y < 23; y++) {
            for (let x = 5; x < 23; x++) {
                if (imageData[y * 28 + x] < 0.1) { // Empty pixel
                    // Check if surrounded by non-empty pixels
                    let surroundingPixels = 0;
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            if (Math.abs(dy) + Math.abs(dx) <= 2) {
                                const ny = y + dy;
                                const nx = x + dx;
                                if (ny >= 0 && ny < 28 && nx >= 0 && nx < 28) {
                                    if (imageData[ny * 28 + nx] > 0.3) {
                                        surroundingPixels++;
                                    }
                                }
                            }
                        }
                    }
                    if (surroundingPixels >= 6) {
                        enclosedRegions++;
                    }
                }
            }
        }
        
        return enclosedRegions > 10;
    }
    
    displayPrediction(prediction) {
        const display = document.getElementById('predictionDisplay');
        const confidencePercent = Math.round(prediction.confidence * 100);
        
        display.innerHTML = `
            <div class="prediction-result">
                <div class="predicted-digit">${prediction.digit}</div>
                <div class="prediction-confidence">${confidencePercent}% confident</div>
                <div class="prediction-label">Predicted digit</div>
            </div>
        `;
        
        this.displayConfidenceBars(prediction.probabilities);
    }
    
    displayConfidenceBars(probabilities) {
        const container = document.getElementById('confidenceBars');
        const maxPrediction = probabilities.indexOf(Math.max(...probabilities));
        
        container.innerHTML = '';
        
        probabilities.forEach((prob, digit) => {
            const percentage = Math.round(prob * 100);
            const isTop = digit === maxPrediction;
            
            const bar = document.createElement('div');
            bar.className = `confidence-bar ${isTop ? 'top-prediction' : ''}`;
            bar.innerHTML = `
                <span class="confidence-digit">${digit}</span>
                <div class="confidence-progress">
                    <div class="confidence-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="confidence-value">${percentage}%</span>
            `;
            
            container.appendChild(bar);
        });
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
        document.getElementById('predictBtn').disabled = true;
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
        document.getElementById('predictBtn').disabled = false;
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Simulate initial loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('show');
    
    setTimeout(() => {
        new MNISTDemo();
    }, 1500);
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
