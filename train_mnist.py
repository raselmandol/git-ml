import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from utils import save_markdown_log, predict_and_log_samples, save_training_graphs, save_test_samples_images, save_test_accuracy_image
import os

EPOCHS = 15
BATCH_SIZE = 64
LR = 0.01

# Load MNIST
transform = transforms.ToTensor()
train_data = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
test_data = datasets.MNIST(root='./data', train=False, download=True, transform=transform)

train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)
test_loader = DataLoader(test_data, batch_size=BATCH_SIZE)

# Define Model
class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(28*28, 128)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = x.view(-1, 28*28)
        x = self.relu(self.fc1(x))
        return self.fc2(x)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Net().to(device)
optimizer = optim.SGD(model.parameters(), lr=LR)
criterion = nn.CrossEntropyLoss()

# Training Loop
train_log = "# Training Metrics\n\n"
train_log += "| Epoch | Loss | Accuracy |\n|-------|------|----------|\n"

save_markdown_log("train_output.md", train_log)
# Also write logs into docs/ for GitHub Pages
import shutil, time
os.makedirs("docs", exist_ok=True)
save_markdown_log(os.path.join("docs", "train_output.md"), train_log)
train_losses = []
train_accuracies = []
for epoch in range(1, EPOCHS + 1):
    model.train()
    total_loss = 0
    correct = 0
    for inputs, labels in train_loader:
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        correct += (outputs.argmax(1) == labels).sum().item()
    avg_loss = total_loss / len(train_loader)
    accuracy = correct / len(train_loader.dataset)
    train_losses.append(avg_loss)
    train_accuracies.append(accuracy)
    train_log += f"| {epoch} | {avg_loss:.4f} | {accuracy:.4f} |\n"
loss_img, acc_img = save_training_graphs(train_losses, train_accuracies, out_dir="images")
train_log += f"\n## Training Loss Graph\n![Training Loss](images/train_loss.png)\n"
train_log += f"\n## Training Accuracy Graph\n![Training Accuracy](images/train_accuracy.png)\n"
save_markdown_log("train_output.md", train_log)

# Save trained model

# Save PyTorch model
torch.save(model.state_dict(), "mnist_model.pt")

# Export ONNX model for browser inference
dummy_input = torch.randn(1, 1, 28, 28, device=device)
torch.onnx.export(
    model,
    dummy_input,
    "docs/mnist_model.onnx",
    input_names=["input"],
    output_names=["output"],
    opset_version=11,
    dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}}
)

# Test Loop
model.eval()
test_loss = 0
correct = 0
with torch.no_grad():
    for inputs, labels in test_loader:
        inputs, labels = inputs.to(device), labels.to(device)
        outputs = model(inputs)
        test_loss += criterion(outputs, labels).item()
        correct += (outputs.argmax(1) == labels).sum().item()

test_accuracy = correct / len(test_loader.dataset)
test_loss /= len(test_loader)

test_log = "# Test Results\n\n"
test_log += f"- **Test Loss**: {test_loss:.4f}\n"
test_log += f"- **Test Accuracy**: {test_accuracy:.4f}\n\n"
test_log += "## Sample Predictions\n\n"
test_log += "| Image Index | True Label | Predicted Label |\n"
test_log += "|-------------|------------|------------------|\n"
test_log += predict_and_log_samples(model, test_loader, device)
sample_imgs = save_test_samples_images(model, test_loader, device, out_dir="images", num_samples=5)
test_log += "\n### Sample Images\n"
for i, (idx, label, pred, img_path) in enumerate(sample_imgs, start=1):
    img_name = os.path.basename(img_path)
    test_log += f"![Sample {i:02d}](images/{img_name}) True: {label}, Pred: {pred}\n"

# Add a test accuracy image that always overwrites
save_test_accuracy_image(test_accuracy, out_dir="images")
test_log += "\n## Test Accuracy Visual\n"
test_log += "![Test Accuracy](images/test_accuracy.png)\n"
save_markdown_log("test_output.md", test_log)
# Mirror test log into docs/
save_markdown_log(os.path.join("docs", "test_output.md"), test_log)

# Ensure images are available under docs/images for GitHub Pages
images_src = "images"
images_dst = os.path.join("docs", "images")
os.makedirs(images_dst, exist_ok=True)
if os.path.isdir(images_src):
    for name in os.listdir(images_src):
        src_path = os.path.join(images_src, name)
        dst_path = os.path.join(images_dst, name)
        try:
            if os.path.isfile(src_path):
                shutil.copy2(src_path, dst_path)
        except Exception as e:
            print(f"Warning: failed to copy {src_path} -> {dst_path}: {e}")

# Overwrite strategy: keep only fixed-named images to avoid bloat
fixed_names = {"train_loss.png", "train_accuracy.png", "test_accuracy.png"}
fixed_names.update({f"sample_{i:02d}.png" for i in range(1, 6)})

def prune_folder(folder: str, keep: set):
    try:
        for fname in os.listdir(folder):
            fpath = os.path.join(folder, fname)
            if os.path.isfile(fpath) and fname not in keep:
                try:
                    os.remove(fpath)
                except Exception as e:
                    print(f"Warning: failed to delete {fpath}: {e}")
    except FileNotFoundError:
        pass

prune_folder(images_src, fixed_names)
prune_folder(images_dst, fixed_names)

# --- Cleanup: Remove __pycache__ and MNIST/raw junk ---
import shutil
for folder in ["__pycache__", "pycache_", "data/MNIST/raw"]:
    if os.path.isdir(folder):
        try:
            shutil.rmtree(folder)
        except Exception:
            pass