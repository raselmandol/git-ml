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
    import torchvision.utils as vutils
    os.makedirs(out_dir, exist_ok=True)
    model.eval()
    dataset = dataloader.dataset
    samples = random.sample(list(enumerate(dataset)), num_samples)
    img_paths = []
    for idx, (img, label) in samples:
        with torch.no_grad():
            input_tensor = img.unsqueeze(0).to(device)
            output = model(input_tensor)
            pred = output.argmax(1).item()
        # Save image with true/pred label in filename
        img_grid = vutils.make_grid(img)
        plt.figure(figsize=(2,2))
        plt.axis('off')
        plt.title(f'True: {label}, Pred: {pred}')
        plt.imshow(img.squeeze(), cmap='gray')
        img_path = os.path.join(out_dir, f"sample_{idx}_T{label}_P{pred}.png")
        plt.savefig(img_path, bbox_inches='tight')
        plt.close()
        img_paths.append((idx, label, pred, img_path))
    return img_paths
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
