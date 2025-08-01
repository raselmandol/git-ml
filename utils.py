# utils.py
import torch
import random

def save_markdown_log(filename, content):
    with open(filename, "w") as f:
        f.write(content)

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
