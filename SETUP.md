# 🛠️ Detailed Setup Guide

This guide will walk you through setting up the MNIST training pipeline and interactive demo from scratch.

## 📋 Prerequisites

Before getting started, make sure you have:

- **Python 3.10 or higher** installed
- **Git** for version control
- **A GitHub account** (for automated training and hosting)
- **Basic command line knowledge**

## 🚀 Quick Setup (5 minutes)

### 1. Fork and Clone the Repository

```bash
# Fork the repository on GitHub first, then clone your fork
git clone https://github.com/YOUR_USERNAME/git-ml.git
cd git-ml
```

### 2. Set Up Python Environment

```bash
# Create a virtual environment (recommended)
python -m venv mnist_env

# Activate the environment
# On Windows:
mnist_env\Scripts\activate
# On macOS/Linux:
source mnist_env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run Your First Training

```bash
# Train the model locally
python train_mnist.py

# This will:
# ✅ Download MNIST dataset automatically
# ✅ Train the neural network for 10 epochs
# ✅ Generate training and test logs with visualizations
# ✅ Save the trained model as mnist_model.pt
```

### 4. View Results

After training completes, check these files:
- 📊 `train_output.md` - Training metrics and graphs
- 📈 `test_output.md` - Test results and sample predictions
- 🖼️ `images/` folder - Generated visualizations

## 🤖 Automated Training Setup

### Enable GitHub Actions

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. **Enable GitHub Actions:**
   - Go to your repository on GitHub
   - Click the "Actions" tab
   - Click "I understand my workflows, go ahead and enable them"

3. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: "GitHub Actions"
   - The interactive demo will be available at `https://yourusername.github.io/git-ml/`

### Automatic Training Schedule

The workflow runs automatically:
- 📝 **On every push** to the main branch
- 🎯 **Manual trigger** via the Actions tab
- ⏰ **Every 6 hours** (scheduled)

## 🌐 Interactive Demo Setup

The interactive demo is automatically deployed to GitHub Pages when you push to main.

### Local Development

To work on the demo locally:

```bash
# Serve the docs folder (Python 3)
cd docs
python -m http.server 8000

# Or use any other local server
# Then visit http://localhost:8000
```

### Customizing the Demo

Edit these files in the `docs/` folder:
- `index.html` - Page structure and content
- `style.css` - Styling and responsive design
- `script.js` - Interactive functionality

## 📊 Understanding the Output

### Training Metrics (`train_output.md`)

```markdown
| Epoch | Loss | Accuracy |
|-------|------|----------|
| 1     | 1.25 | 0.738    |
| 2     | 0.50 | 0.874    |
...
```

- **Loss**: Average loss per batch (lower is better)
- **Accuracy**: Percentage of correctly classified training samples

### Test Results (`test_output.md`)

- **Test Accuracy**: Performance on unseen data (~92.8%)
- **Sample Predictions**: Visual examples with true vs predicted labels
- **Sample Images**: MNIST digits with overlay predictions

### Generated Images

- `images/train_loss.png` - Training loss progression
- `images/train_accuracy.png` - Training accuracy progression
- `images/sample_*_T*_P*.png` - Test samples (T=true, P=predicted)

## 🔧 Customization Options

### Model Architecture

Edit `train_mnist.py` to modify the neural network:

```python
class Net(nn.Module):
    def __init__(self):
        super().__init__()
        # Modify these layers
        self.fc1 = nn.Linear(28*28, 128)  # Hidden layer size
        self.relu = nn.ReLU()             # Activation function
        self.fc2 = nn.Linear(128, 10)     # Output layer
```

### Training Parameters

```python
EPOCHS = 10        # Number of training epochs
BATCH_SIZE = 64    # Batch size for training
LR = 0.01         # Learning rate
```

### Visualization

Edit `utils.py` to customize graphs and sample images:
- Change plot colors and styles
- Modify image sizes and formats
- Add new visualization types

## 🐛 Troubleshooting

### Common Issues

**"ModuleNotFoundError: No module named 'torch'"**
```bash
pip install torch torchvision matplotlib
```

**"Permission denied" on GitHub Actions**
- Ensure GitHub Actions are enabled in repository settings
- Check that GITHUB_TOKEN has necessary permissions

**Images not showing in markdown**
- Verify the `images/` folder exists and contains PNG files
- Check that GitHub Actions is committing the images folder
- Ensure relative paths are correct in markdown

**Demo not working on mobile**
- The demo is responsive and should work on all devices
- Try refreshing the page or clearing browser cache

### Performance Issues

**Training is slow**
- The model trains on CPU by default
- For GPU acceleration, ensure PyTorch CUDA is installed
- Consider reducing EPOCHS or BATCH_SIZE for faster training

**Large repository size**
- Images and model files can accumulate over time
- Consider using Git LFS for large files
- Clean up old image files periodically

## 📚 Advanced Usage

### Custom Datasets

To use your own dataset, modify the data loading section:

```python
# Replace MNIST with your dataset
transform = transforms.ToTensor()
train_data = YourDataset(root='./data', train=True, transform=transform)
test_data = YourDataset(root='./data', train=False, transform=transform)
```

### Different Architectures

Try convolutional neural networks:

```python
class ConvNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, 3)
        self.conv2 = nn.Conv2d(32, 64, 3)
        self.fc1 = nn.Linear(9216, 128)
        self.fc2 = nn.Linear(128, 10)
```

### Real Model Deployment

For production deployment with actual model inference:

1. **Convert to ONNX:**
   ```python
   torch.onnx.export(model, dummy_input, "model.onnx")
   ```

2. **Use ONNX.js or TensorFlow.js** for browser inference

3. **Update the demo script** to load the real model

## 🤝 Contributing

We welcome contributions! Here's how to contribute:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test them
4. **Update documentation** if needed
5. **Submit a pull request**

### Development Guidelines

- Follow Python PEP 8 style guidelines
- Add comments to explain complex logic
- Test changes locally before submitting
- Update README if adding new features

## 📞 Support

Need help? Here are your options:

- 🐛 **Bug Reports**: [Open an issue](https://github.com/raselmandol/git-ml/issues)
- 💡 **Feature Requests**: [Open an issue](https://github.com/raselmandol/git-ml/issues)
- 💬 **Questions**: [Start a discussion](https://github.com/raselmandol/git-ml/discussions)
- 📧 **Direct Contact**: Check the repository for maintainer contacts

---

<div align="center">

**🎉 Happy Training!**

Don't forget to ⭐ star the repository if you find it helpful!

</div>
