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
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
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
            // Invert colors (black on white to white on black like MNIST)
            const gray = 255 - (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            grayscale.push(gray / 255.0);
        }
        
        // Resize to 28x28 using proper downsampling
        const resized = this.resizeImageProper(grayscale, this.canvas.width, 28);
        
        return resized;
    }
    
    resizeImageProper(imageData, originalSize, newSize) {
        const ratio = originalSize / newSize;
        const resized = [];
        
        for (let y = 0; y < newSize; y++) {
            for (let x = 0; x < newSize; x++) {
                let sum = 0;
                let count = 0;
                
                // Average pixels in the source region
                const startY = Math.floor(y * ratio);
                const endY = Math.min(originalSize - 1, Math.floor((y + 1) * ratio));
                const startX = Math.floor(x * ratio);
                const endX = Math.min(originalSize - 1, Math.floor((x + 1) * ratio));
                
                for (let sy = startY; sy <= endY; sy++) {
                    for (let sx = startX; sx <= endX; sx++) {
                        const index = sy * originalSize + sx;
                        if (index < imageData.length) {
                            sum += imageData[index];
                            count++;
                        }
                    }
                }
                
                resized.push(count > 0 ? sum / count : 0);
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
        // Improved pattern matching for demonstration
        const predictions = new Array(10).fill(0.01); // Small base probability
        
        // Analyze image characteristics
        const stats = this.analyzeImage(imageData);
        
        // Enhanced pattern recognition based on MNIST characteristics
        
        // Digit 0: Circular shape with hole in center
        if (stats.hasLargeHole && stats.circularity > 0.6) {
            predictions[0] += 0.6;
        }
        
        // Digit 1: Vertical line, high aspect ratio, low width
        if (stats.aspectRatio > 1.5 && stats.horizontalDensity < 0.3) {
            predictions[1] += 0.7;
        }
        
        // Digit 2: Top-heavy with horizontal strokes
        if (stats.topHeaviness > 0.3 && stats.horizontalStrokes > 2) {
            predictions[2] += 0.5;
        }
        
        // Digit 3: Two bumps on right side
        if (stats.rightSideBumps >= 2 && !stats.hasLargeHole) {
            predictions[3] += 0.5;
        }
        
        // Digit 4: Vertical line on right, crossing lines
        if (stats.rightVerticalLine && stats.crossingPoint) {
            predictions[4] += 0.6;
        }
        
        // Digit 5: Top horizontal line, bottom curve
        if (stats.topHorizontalLine && stats.bottomCurve) {
            predictions[5] += 0.5;
        }
        
        // Digit 6: Large loop on bottom
        if (stats.bottomLoop && !stats.topLoop) {
            predictions[6] += 0.6;
        }
        
        // Digit 7: Top-heavy, diagonal stroke
        if (stats.topHeaviness > 0.4 && stats.diagonalStroke) {
            predictions[7] += 0.6;
        }
        
        // Digit 8: Two loops (top and bottom)
        if (stats.topLoop && stats.bottomLoop) {
            predictions[8] += 0.7;
        }
        
        // Digit 9: Loop on top
        if (stats.topLoop && !stats.bottomLoop) {
            predictions[9] += 0.6;
        }
        
        // Add some controlled randomness
        for (let i = 0; i < 10; i++) {
            predictions[i] += Math.random() * 0.1;
        }
        
        // Normalize to probabilities
        const sum = predictions.reduce((a, b) => a + b, 0);
        const normalized = predictions.map(p => Math.max(0.001, p / sum));
        
        // Find top prediction
        const maxIndex = normalized.indexOf(Math.max(...normalized));
        const confidence = normalized[maxIndex];
        
        return {
            digit: maxIndex,
            confidence: confidence,
            probabilities: normalized
        };
    }
    
    analyzeImage(imageData) {
        const size = 28;
        const stats = {
            density: 0,
            centerMass: { x: 0, y: 0 },
            aspectRatio: 1,
            topHeaviness: 0,
            horizontalDensity: 0,
            verticalDensity: 0,
            hasLargeHole: false,
            circularity: 0,
            horizontalStrokes: 0,
            rightSideBumps: 0,
            rightVerticalLine: false,
            crossingPoint: false,
            topHorizontalLine: false,
            bottomCurve: false,
            bottomLoop: false,
            topLoop: false,
            diagonalStroke: false
        };
        
        // Calculate basic statistics
        let totalMass = 0;
        let centerX = 0, centerY = 0;
        let minX = size, maxX = 0, minY = size, maxY = 0;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const pixel = imageData[y * size + x];
                if (pixel > 0.2) {
                    totalMass += pixel;
                    centerX += x * pixel;
                    centerY += y * pixel;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        if (totalMass > 0) {
            stats.centerMass.x = centerX / totalMass;
            stats.centerMass.y = centerY / totalMass;
            stats.density = totalMass / (size * size);
            stats.aspectRatio = (maxY - minY + 1) / (maxX - minX + 1);
        }
        
        // Analyze top vs bottom heaviness
        let topHalf = 0, bottomHalf = 0;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const pixel = imageData[y * size + x];
                if (y < size / 2) topHalf += pixel;
                else bottomHalf += pixel;
            }
        }
        stats.topHeaviness = (topHalf - bottomHalf) / (topHalf + bottomHalf + 0.001);
        
        // Analyze stroke directions
        let horizontal = 0, vertical = 0;
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                const center = imageData[y * size + x];
                if (center > 0.3) {
                    const left = imageData[y * size + (x - 1)];
                    const right = imageData[y * size + (x + 1)];
                    const top = imageData[(y - 1) * size + x];
                    const bottom = imageData[(y + 1) * size + x];
                    
                    if (left > 0.2 || right > 0.2) horizontal++;
                    if (top > 0.2 || bottom > 0.2) vertical++;
                }
            }
        }
        stats.horizontalDensity = horizontal / (horizontal + vertical + 1);
        stats.verticalDensity = vertical / (horizontal + vertical + 1);
        
        // Check for holes (simplified)
        stats.hasLargeHole = this.hasSignificantHole(imageData, size);
        
        // Check for loops
        stats.topLoop = this.hasLoopInRegion(imageData, size, 0, size / 2);
        stats.bottomLoop = this.hasLoopInRegion(imageData, size, size / 2, size);
        
        // Check for specific features
        stats.rightVerticalLine = this.hasRightVerticalLine(imageData, size);
        stats.topHorizontalLine = this.hasTopHorizontalLine(imageData, size);
        stats.diagonalStroke = this.hasDiagonalStroke(imageData, size);
        
        return stats;
    }
    
    hasSignificantHole(imageData, size) {
        // Simple hole detection in center region
        let emptyPixels = 0;
        const centerRegion = size / 3;
        const startX = Math.floor(size / 2 - centerRegion / 2);
        const endX = Math.floor(size / 2 + centerRegion / 2);
        const startY = Math.floor(size / 2 - centerRegion / 2);
        const endY = Math.floor(size / 2 + centerRegion / 2);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (imageData[y * size + x] < 0.1) {
                    emptyPixels++;
                }
            }
        }
        
        return emptyPixels > (centerRegion * centerRegion * 0.3);
    }
    
    hasLoopInRegion(imageData, size, startY, endY) {
        // Check for enclosed regions
        let potentialLoops = 0;
        for (let y = Math.floor(startY) + 2; y < Math.floor(endY) - 2; y++) {
            for (let x = 2; x < size - 2; x++) {
                if (imageData[y * size + x] < 0.1) {
                    // Check if surrounded by ink
                    let surroundingInk = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (imageData[(y + dy) * size + (x + dx)] > 0.3) {
                                surroundingInk++;
                            }
                        }
                    }
                    if (surroundingInk >= 6) potentialLoops++;
                }
            }
        }
        return potentialLoops > 5;
    }
    
    hasRightVerticalLine(imageData, size) {
        // Check for vertical line on right side
        let rightSideInk = 0;
        const rightColumn = Math.floor(size * 0.8);
        for (let y = 0; y < size; y++) {
            if (imageData[y * size + rightColumn] > 0.3) {
                rightSideInk++;
            }
        }
        return rightSideInk > size * 0.4;
    }
    
    hasTopHorizontalLine(imageData, size) {
        // Check for horizontal line on top
        let topRowInk = 0;
        const topRow = Math.floor(size * 0.2);
        for (let x = 0; x < size; x++) {
            if (imageData[topRow * size + x] > 0.3) {
                topRowInk++;
            }
        }
        return topRowInk > size * 0.4;
    }
    
    hasDiagonalStroke(imageData, size) {
        // Check for diagonal strokes
        let diagonalInk = 0;
        for (let i = 0; i < size; i++) {
            const y = Math.floor(i * 0.6); // Diagonal from top-left to bottom-right
            const x = i;
            if (y < size && x < size && imageData[y * size + x] > 0.3) {
                diagonalInk++;
            }
        }
        return diagonalInk > size * 0.3;
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
