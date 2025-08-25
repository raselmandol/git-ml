"""
Model Conversion Utility
This script demonstrates how to convert the PyTorch model for web deployment.
For now, it creates a simplified version that can be used as reference.
"""
import torch
import json
import os

def export_model_info():
    """Export model architecture and sample weights for web demo"""
    
    # Define the same model architecture as in train_mnist.py
    class Net(torch.nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = torch.nn.Linear(28*28, 128)
            self.relu = torch.nn.ReLU()
            self.fc2 = torch.nn.Linear(128, 10)

        def forward(self, x):
            x = x.view(-1, 28*28)
            x = self.relu(self.fc1(x))
            return self.fc2(x)
    
    # Load the trained model if it exists
    model = Net()
    
    if os.path.exists('mnist_model.pt'):
        try:
            model.load_state_dict(torch.load('mnist_model.pt', map_location='cpu'))
            print("✓ Loaded trained model weights")
        except Exception as e:
            print(f"Warning: Could not load model: {e}")
            print("Using randomly initialized weights")
    else:
        print("Warning: No trained model found, using random weights")
    
    # --- Read actual metrics from markdown logs ---
    def get_final_train_accuracy(path):
        try:
            with open(path, 'r') as f:
                lines = f.readlines()
            # Find last line with epoch data
            for line in reversed(lines):
                if '|' in line and not line.startswith('|---') and not line.startswith('#'):
                    parts = line.strip().split('|')
                    if len(parts) >= 4:
                        acc = parts[3].strip()
                        try:
                            return float(acc)
                        except Exception:
                            pass
            return None
        except Exception:
            return None

    def get_test_metrics(path):
        test_acc = None
        test_loss = None
        try:
            with open(path, 'r') as f:
                for line in f:
                    if 'Test Accuracy' in line:
                        try:
                            test_acc = float(line.split(':')[-1].strip())
                        except Exception:
                            pass
                    if 'Test Loss' in line:
                        try:
                            test_loss = float(line.split(':')[-1].strip())
                        except Exception:
                            pass
            return test_acc, test_loss
        except Exception:
            return None, None

    train_acc = get_final_train_accuracy('train_output.md')
    test_acc, test_loss = get_test_metrics('test_output.md')

    # Export model information
    model_info = {
        'architecture': {
            'input_size': 784,  # 28x28
            'hidden_size': 128,
            'output_size': 10,
            'activation': 'ReLU'
        },
        'training_info': {
            'epochs': 15,
            'batch_size': 64,
            'learning_rate': 0.01,
            'optimizer': 'SGD',
            'loss_function': 'CrossEntropyLoss'
        },
        'performance': {
            'train_accuracy': f'{train_acc:.4f}' if train_acc is not None else None,
            'test_accuracy': f'{test_acc:.4f}' if test_acc is not None else None,
            'test_loss': f'{test_loss:.4f}' if test_loss is not None else None,
            'training_time': '~3 minutes'
        }
    }
    
    # Save model info to docs folder
    os.makedirs('docs', exist_ok=True)
    with open('docs/model_info.json', 'w') as f:
        json.dump(model_info, f, indent=2)
    
    print("Model information exported to docs/model_info.json")
    print("This can be used by the web demo for display purposes")
    
    # For future: actual model conversion to ONNX or TensorFlow.js format
    print("\nFuture enhancement: Convert to ONNX or TensorFlow.js for real inference")
    print("   - torch.onnx.export() for ONNX format")
    print("   - Use onnx-web or tensorflow.js for browser inference")

if __name__ == "__main__":
    export_model_info()
