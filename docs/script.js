// MNIST Training Dashboard - Real-time Data Fetcher
// Fetches and displays training insights, test results, and model performance

class TrainingDashboard {
    constructor() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.init();
    }

    async init() {
        this.showLoading();
        await Promise.all([
            this.loadTrainingData(),
            this.loadTestData(),
            this.populateSamplePredictions(),
            this.updateLastModified()
        ]);
        this.hideLoading();
        this.startAutoRefresh();
    }

    showLoading() {
        this.loadingOverlay.classList.add('show');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }

    async loadTrainingData() {
        try {
            // In a real implementation, you would fetch from train_output.md or API
            // For now, we'll parse the current data from the markdown files
            const response = await fetch('../train_output.md');
            const text = await response.text();
            
            this.parseTrainingMetrics(text);
        } catch (error) {
            console.warn('Could not load training data:', error);
            this.useStaticTrainingData();
        }
    }

    async loadTestData() {
        try {
            const response = await fetch('../test_output.md');
            const text = await response.text();
            
            this.parseTestResults(text);
        } catch (error) {
            console.warn('Could not load test data:', error);
            this.useStaticTestData();
        }
    }

    parseTrainingMetrics(markdownText) {
        // Extract metrics from markdown table
        const lines = markdownText.split('\n');
        const tableRows = lines.filter(line => line.includes('|') && !line.includes('---'));
        
        if (tableRows.length > 2) { // Header + at least one data row
            const lastRow = tableRows[tableRows.length - 1];
            const cells = lastRow.split('|').map(cell => cell.trim()).filter(cell => cell);
            
            if (cells.length >= 3) {
                const finalAccuracy = parseFloat(cells[2]);
                document.getElementById('testAccuracy').textContent = `${(finalAccuracy * 100).toFixed(2)}%`;
                
                // Calculate epochs
                const epochs = tableRows.length - 2; // Subtract header rows
                document.getElementById('totalEpochs').textContent = epochs.toString();
            }
        }
    }

    parseTestResults(markdownText) {
        // Extract test accuracy and loss from markdown
        const accuracyMatch = markdownText.match(/Test Accuracy\*\*:\s*([\d.]+)/);
        const lossMatch = markdownText.match(/Test Loss\*\*:\s*([\d.]+)/);
        
        if (accuracyMatch) {
            const accuracy = parseFloat(accuracyMatch[1]);
            document.getElementById('testAccuracy').textContent = `${(accuracy * 100).toFixed(2)}%`;
        }
        
        if (lossMatch) {
            document.getElementById('testLoss').textContent = parseFloat(lossMatch[1]).toFixed(4);
        }

        // Parse sample predictions table
        this.parseSamplePredictions(markdownText);
    }

    parseSamplePredictions(markdownText) {
        const lines = markdownText.split('\n');
        const sampleRows = lines.filter(line => 
            line.includes('|') && 
            !line.includes('---') && 
            !line.includes('Image Index') &&
            line.match(/\|\s*\d+\s*\|\s*\d+\s*\|\s*\d+\s*\|/)
        );

        const predictions = sampleRows.slice(0, 8).map(row => {
            const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
            if (cells.length >= 3) {
                return {
                    index: cells[0],
                    true_label: parseInt(cells[1]),
                    predicted_label: parseInt(cells[2]),
                    correct: cells[1] === cells[2]
                };
            }
            return null;
        }).filter(Boolean);

        this.displaySamplePredictions(predictions);
    }

    displaySamplePredictions(predictions) {
        const grid = document.getElementById('predictionsGrid');
        grid.innerHTML = '';

        predictions.forEach(pred => {
            const item = document.createElement('div');
            item.className = `prediction-item ${pred.correct ? 'correct' : 'incorrect'}`;
            
            item.innerHTML = `
                <div class="prediction-digit">${pred.predicted_label}</div>
                <div class="prediction-labels">
                    True: ${pred.true_label}<br>
                    ${pred.correct ? 'Correct' : 'Wrong'}
                </div>
            `;
            
            grid.appendChild(item);
        });
    }

    useStaticTrainingData() {
        // Fallback to static data if markdown files are not accessible
        document.getElementById('testAccuracy').textContent = '93.00%';
        document.getElementById('totalEpochs').textContent = '10';
    }

    useStaticTestData() {
        // Fallback static test data
        document.getElementById('testLoss').textContent = '0.2529';
        
        // Static sample predictions
        const staticPredictions = [
            { true_label: 8, predicted_label: 8, correct: true },
            { true_label: 7, predicted_label: 7, correct: true },
            { true_label: 2, predicted_label: 8, correct: false },
            { true_label: 5, predicted_label: 5, correct: true },
            { true_label: 1, predicted_label: 1, correct: true },
            { true_label: 0, predicted_label: 0, correct: true },
            { true_label: 9, predicted_label: 7, correct: false },
            { true_label: 3, predicted_label: 3, correct: true }
        ];
        
        this.displaySamplePredictions(staticPredictions);
    }

    async populateSamplePredictions() {
        // This would typically load actual sample images and predictions
        // For now, we'll use the parsed data from test_output.md
    }

    async updateLastModified() {
        try {
            // Try to get the last commit date from GitHub API
            const response = await fetch('https://api.github.com/repos/raselmandol/git-ml/commits/main');
            const data = await response.json();
            
            const lastUpdate = new Date(data.commit.committer.date);
            document.getElementById('lastUpdate').textContent = this.formatDate(lastUpdate);
            
            // Update training status based on recent activity
            const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
            const statusElement = document.getElementById('trainingStatus');
            
            if (hoursAgo < 1) {
                statusElement.textContent = 'Recently Trained';
                statusElement.className = 'badge status';
            } else if (hoursAgo < 6) {
                statusElement.textContent = 'Training Active';
                statusElement.className = 'badge status';
            } else {
                statusElement.textContent = 'Scheduled';
                statusElement.className = 'badge automation';
            }
            
        } catch (error) {
            document.getElementById('lastUpdate').textContent = 'Recently';
        }
    }

    formatDate(date) {
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    startAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            this.loadTrainingData();
            this.loadTestData();
            this.updateLastModified();
        }, 5 * 60 * 1000);
    }

    // Animate metrics on load
    animateMetrics() {
        const metricValues = document.querySelectorAll('.metric-value');
        metricValues.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    element.style.transition = 'all 0.6s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 100);
            }, index * 150);
        });
    }
}

// Analytics and insights
class TrainingAnalytics {
    static calculateTrends(currentMetrics, previousMetrics) {
        const trends = {};
        
        for (const [key, current] of Object.entries(currentMetrics)) {
            if (previousMetrics[key] !== undefined) {
                const change = current - previousMetrics[key];
                const percentChange = ((change / previousMetrics[key]) * 100).toFixed(1);
                
                trends[key] = {
                    change: change,
                    percentChange: percentChange,
                    direction: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
                };
            }
        }
        
        return trends;
    }

    static updateTrendIndicators(trends) {
        // Update the metric change indicators with real trend data
        for (const [metric, trend] of Object.entries(trends)) {
            const changeElement = document.querySelector(`#${metric} .metric-change`);
            if (changeElement) {
                changeElement.textContent = `${trend.change > 0 ? '+' : ''}${trend.percentChange}% from last run`;
                changeElement.className = `metric-change ${trend.direction}`;
            }
        }
    }
}

// Performance monitoring
class PerformanceMonitor {
    static trackPageLoad() {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
            
            // Track which sections load successfully
            const sections = document.querySelectorAll('section');
            sections.forEach(section => {
                if (section.offsetHeight > 0) {
                    console.log(`Section loaded: ${section.className || section.tagName}`);
                }
            });
        });
    }

    static trackDataFreshness() {
        const dataTimestamp = localStorage.getItem('lastDataUpdate');
        if (dataTimestamp) {
            const lastUpdate = new Date(parseInt(dataTimestamp));
            const staleness = (Date.now() - lastUpdate.getTime()) / (1000 * 60); // minutes
            
            if (staleness > 30) { // 30 minutes
                console.warn(`Data is ${Math.floor(staleness)} minutes old`);
            }
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new TrainingDashboard();
    
    // Start performance monitoring
    PerformanceMonitor.trackPageLoad();
    PerformanceMonitor.trackDataFreshness();
    
    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add intersection observer for section animations
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
    
    // Observe all metric cards and chart wrappers
    document.querySelectorAll('.metric-card, .chart-wrapper, .test-summary, .sample-predictions').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
