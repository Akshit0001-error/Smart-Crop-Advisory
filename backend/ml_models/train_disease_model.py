"""
train_disease_model.py
═══════════════════════
Fine-tunes a ResNet-18 on the PlantVillage dataset for plant disease detection.

Dataset:
    Download from https://www.kaggle.com/datasets/emmarex/plantdisease
    Unzip so the structure is:
        ml_models/PlantVillage/
            Tomato___Bacterial_spot/  (image files)
            Tomato___Early_blight/
            ...

Run:
    python ml_models/train_disease_model.py --data ml_models/PlantVillage --epochs 10

Output:
    ml_models/disease_model.pth   ← loaded automatically by disease_predictor.py
"""

import os
import argparse
import copy
import time

# ── Guard: only run if PyTorch is installed ──────────────────────────────────
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader
    from torchvision import datasets, models, transforms
except ImportError:
    print("PyTorch / torchvision not installed.")
    print("Install with:  pip install torch torchvision")
    raise

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_SAVE   = os.path.join(SCRIPT_DIR, 'disease_model.pth')

# Image size expected by ResNet
IMG_SIZE     = 224
BATCH_SIZE   = 32


def get_transforms():
    """Data augmentation for training; simple resize/normalize for validation."""
    return {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(IMG_SIZE),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225]),
        ]),
        'val': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(IMG_SIZE),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225]),
        ]),
    }


def build_model(num_classes: int) -> nn.Module:
    """
    Load ImageNet-pretrained ResNet-18 and replace the final FC layer
    with one matching our number of disease classes.
    Only the FC layer is trained by default (transfer learning).
    """
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)

    # Freeze all layers except the final fully-connected layer
    for param in model.parameters():
        param.requires_grad = False

    # Replace FC → num_classes outputs
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model


def train_model(data_dir: str, epochs: int, lr: float) -> None:
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[INFO] Using device: {device}")

    tfms = get_transforms()

    # ── Dataset & Loaders ────────────────────────────────────────────
    full_dataset = datasets.ImageFolder(data_dir, transform=tfms['train'])
    n_total      = len(full_dataset)
    n_val        = int(n_total * 0.2)
    n_train      = n_total - n_val

    train_ds, val_ds = torch.utils.data.random_split(
        full_dataset, [n_train, n_val],
        generator=torch.Generator().manual_seed(42)
    )
    # Override transform for validation split
    val_ds.dataset = copy.deepcopy(full_dataset)
    val_ds.dataset.transform = tfms['val']

    loaders = {
        'train': DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=4),
        'val':   DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=4),
    }

    class_names = full_dataset.classes
    print(f"[INFO] {len(class_names)} classes, {n_train} train / {n_val} val images")

    # ── Model, loss, optimizer ────────────────────────────────────────
    model     = build_model(len(class_names)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.fc.parameters(), lr=lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)

    best_acc   = 0.0
    best_state = None

    # ── Training loop ────────────────────────────────────────────────
    for epoch in range(1, epochs + 1):
        print(f"\nEpoch {epoch}/{epochs}  {'─'*40}")

        for phase in ('train', 'val'):
            model.train() if phase == 'train' else model.eval()

            running_loss = 0.0
            running_correct = 0

            t0 = time.time()
            for inputs, labels in loaders[phase]:
                inputs, labels = inputs.to(device), labels.to(device)

                optimizer.zero_grad()
                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    loss    = criterion(outputs, labels)
                    preds   = outputs.argmax(dim=1)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss    += loss.item() * inputs.size(0)
                running_correct += (preds == labels).sum().item()

            epoch_loss = running_loss    / len(loaders[phase].dataset)
            epoch_acc  = running_correct / len(loaders[phase].dataset)
            elapsed    = time.time() - t0

            print(f"  {phase.upper():5s}  loss={epoch_loss:.4f}  "
                  f"acc={epoch_acc:.4f}  ({elapsed:.1f}s)")

            if phase == 'val' and epoch_acc > best_acc:
                best_acc   = epoch_acc
                best_state = copy.deepcopy(model.state_dict())

        scheduler.step()

    # ── Save best weights ─────────────────────────────────────────────
    torch.save(best_state, MODEL_SAVE)
    print(f"\n[SAVED] Best val acc = {best_acc:.4f}")
    print(f"[SAVED] Model → {MODEL_SAVE}")

    # Save class list for reference
    classes_path = os.path.join(SCRIPT_DIR, 'disease_classes.txt')
    with open(classes_path, 'w') as f:
        f.write('\n'.join(class_names))
    print(f"[SAVED] Class list → {classes_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train Disease Detection CNN')
    parser.add_argument('--data',   default='ml_models/PlantVillage',
                        help='Path to PlantVillage dataset root')
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--lr',     type=float, default=1e-3)
    args = parser.parse_args()

    if not os.path.isdir(args.data):
        print(f"[WARNING] Dataset not found at '{args.data}'.")
        print("Download from https://www.kaggle.com/datasets/emmarex/plantdisease")
        print("The backend will use the mock predictor until a real model is trained.")
    else:
        train_model(args.data, args.epochs, args.lr)
