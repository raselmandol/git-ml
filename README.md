# MNIST Training & Testing Automation

This repository provides a fully automated pipeline for training and testing a simple neural network on the MNIST dataset using PyTorch. All steps are orchestrated via GitHub Actions, so you get fresh results and logs every time you push or on a schedule.

## Features
- **Automatic Training & Testing:** Runs on every push, manual trigger, or every 6 hours.
- **Markdown Logs:** Training and test metrics are logged in markdown files for easy viewing.
- **Visualizations:**
  - Training loss and accuracy graphs are generated and embedded in logs.
  - Test logs include sample MNIST images with true and predicted labels.
- **Model Saving:** Trained model weights are saved for reuse.
- **Easy to Extend:** Simple code structure for experimenting with architectures or datasets.

## Outputs
- `train_output.md`: Contains a table of training metrics and embedded graphs for loss and accuracy.
- `test_output.md`: Shows test loss/accuracy and sample predictions with images.
- `mnist_model.pt`: The trained model weights.
- PNG images: Graphs and sample prediction images are saved in the repo and referenced in logs.

## Usage

### Local Run
1. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
2. Run training:
   ```powershell
   python train_mnist.py
   ```
3. View results in `train_output.md` and `test_output.md`.

### GitHub Actions
- The workflow file `.github/workflows/train_mnist.yml` automates everything. Results and model are committed back to the repo after each run.

## Example Output

**Training Metrics Table & Graphs:**
![Training Loss](train_loss.png)
![Training Accuracy](train_accuracy.png)

**Test Results & Sample Predictions:**
![Sample 0](sample_0_T7_P7.png) True: 7, Pred: 7
![Sample 1](sample_1_T2_P2.png) True: 2, Pred: 2

## Customization
- Modify `train_mnist.py` to change model architecture, epochs, batch size, etc.
- Extend `utils.py` for more advanced logging or visualization.

## License
MIT

---
Enjoy experimenting with MNIST and PyTorch, now with beautiful logs and images!
