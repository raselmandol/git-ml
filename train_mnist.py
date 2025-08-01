# train_mnist.py
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from utils import save_markdown_log, predict_and_log_samples

EPOCHS = 10
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

    accuracy = correct / len(train_loader.dataset)
    train_log += f"| {epoch} | {total_loss:.4f} | {accuracy:.4f} |\n"

save_markdown_log("train_output.md", train_log)

# Save trained model
torch.save(model.state_dict(), "mnist_model.pt")

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

save_markdown_log("test_output.md", test_log)
