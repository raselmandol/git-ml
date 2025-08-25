# utils.py
import torch
import random
import matplotlib.pyplot as plt
import os

def save_markdown_log(filename, content):
    with open(filename, "w") as f:
        f.write(content)

def save_training_graphs(losses, accuracies, out_dir="."):
    os.makedirs(out_dir, exist_ok=True)
    plt.figure()
    plt.plot(range(1, len(losses)+1), losses, marker='o')
    plt.title('Training Loss per Epoch')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.grid(True)
    loss_path = os.path.join(out_dir, "train_loss.png")
    plt.savefig(loss_path)
    plt.close()

    plt.figure()
    plt.plot(range(1, len(accuracies)+1), accuracies, marker='o')
    plt.title('Training Accuracy per Epoch')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.grid(True)
    acc_path = os.path.join(out_dir, "train_accuracy.png")
    plt.savefig(acc_path)
    plt.close()
    return loss_path, acc_path

def save_test_samples_images(model, dataloader, device, out_dir=".", num_samples=5):
    """
    Save a fixed set of sample prediction images using deterministic filenames
    like sample_01.png .. sample_05.png so they always overwrite.
    Returns a list of tuples: (dataset_index, true_label, pred_label, img_path)
    """
    import torchvision.utils as vutils  # noqa: F401  (kept for potential future grid use)
    os.makedirs(out_dir, exist_ok=True)
    model.eval()
    dataset = dataloader.dataset

    # Choose random distinct samples but save under fixed filenames to overwrite
    num_samples = max(1, int(num_samples))
    indices = random.sample(range(len(dataset)), min(num_samples, len(dataset)))

    results = []
    for i, idx in enumerate(indices, start=1):
        img, label = dataset[idx]
        with torch.no_grad():
            input_tensor = img.unsqueeze(0).to(device)
            output = model(input_tensor)
            pred = output.argmax(1).item()

        # Save as fixed filename sample_01.png, sample_02.png, ... to overwrite
        fname = f"sample_{i:02d}.png"
        img_path = os.path.join(out_dir, fname)
        plt.figure(figsize=(2, 2))
        plt.axis('off')
        plt.title(f'True: {label}, Pred: {pred}')
        plt.imshow(img.squeeze(), cmap='gray')
        plt.savefig(img_path, bbox_inches='tight')
        plt.close()
        results.append((idx, label, pred, img_path))

    return results

def save_test_accuracy_image(test_accuracy: float, out_dir: str = ".") -> str:
    """Create/overwrite an image summarizing test accuracy as text."""
    os.makedirs(out_dir, exist_ok=True)
    plt.figure(figsize=(4, 3))
    plt.axis('off')
    plt.text(0.5, 0.6, 'Test Accuracy', ha='center', va='center', fontsize=16, weight='bold')
    plt.text(0.5, 0.35, f"{test_accuracy * 100:.2f}%", ha='center', va='center', fontsize=22)
    # Optional simple bar
    acc = max(0.0, min(1.0, float(test_accuracy)))
    plt.hlines(0.1, 0.1, 0.9, colors='#e0e0e0', linewidth=12)
    plt.hlines(0.1, 0.1, 0.1 + 0.8 * acc, colors='#4caf50', linewidth=12)
    out_path = os.path.join(out_dir, 'test_accuracy.png')
    plt.savefig(out_path, bbox_inches='tight')
    plt.close()
    return out_path
def predict_and_log_samples(model, dataloader, device, num_samples=5):
    model.eval()
    dataset = dataloader.dataset
    samples = random.sample(list(enumerate(dataset)), num_samples)

    log = ""
    for idx, (img, label) in samples:
        with torch.no_grad():
            input_tensor = img.unsqueeze(0).to(device)
            output = model(input_tensor)
            pred = output.argmax(1).item()
        log += f"| {idx} | {label} | {pred} |\n"
    return log
