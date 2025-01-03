import torch

# Tokens laden
print("=" * 50)
print("Lade Tokens...")
train_tokens = torch.load("data/processed/train_tokens.pt")
val_tokens = torch.load("data/processed/val_tokens.pt")
test_tokens = torch.load("data/processed/test_tokens.pt")
print("Tokens erfolgreich geladen.")

# Labels laden
print("=" * 50)
print("Lade Labels...")
train_labels = torch.load("data/processed/train_labels.pt")
val_labels = torch.load("data/processed/val_labels.pt")
test_labels = torch.load("data/processed/test_labels.pt")
print("Labels erfolgreich geladen.")

# Übersicht anzeigen
print("=" * 50)
print(f"Train-Daten: {len(train_labels)} Einträge")
print(f"Val-Daten:   {len(val_labels)} Einträge")
print(f"Test-Daten:  {len(test_labels)} Einträge")
print("=" * 50)

from torch.utils.data import Dataset

class SQLDataset(Dataset):
    def __init__(self, tokens, labels):
        self.tokens = tokens
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {key: val[idx] for key, val in self.tokens.items()}
        item['labels'] = self.labels[idx]
        return item

# Datasets erstellen
print("Erstelle Datasets...")
train_dataset = SQLDataset(train_tokens, train_labels)
val_dataset = SQLDataset(val_tokens, val_labels)
test_dataset = SQLDataset(test_tokens, test_labels)
print("Datasets erfolgreich erstellt.")
print("=" * 50)

from torch.utils.data import DataLoader

# DataLoader erstellen
train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True, num_workers=8)
val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False, num_workers=8)
test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False, num_workers=8)

from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Modell laden
from config import model_name
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

# optimizer
from torch.optim import AdamW
optimizer = AdamW(model.parameters(), lr=5e-5)  # Lernrate

# loss function
from torch.nn import CrossEntropyLoss
loss_fn = CrossEntropyLoss()

device = torch.device("cpu")
model.to(device)

num_epochs = 1  # 3 - 10

import time

# Startzeit speichern
start_time = time.time()

print("=" * 50)
print(f"Starte Training mit {num_epochs} Epochen...\n")

for epoch in range(num_epochs):
    print(f"===> Starte Epoche {epoch + 1}/{num_epochs}")
    epoch_start_time = time.time()  # Startzeit pro Epoche
    model.train()  # Modell in den Trainingsmodus setzen
    total_loss = 0

    for i, batch in enumerate(train_loader):
        # Daten auf das Gerät verschieben
        batch = {k: v.to(device) for k, v in batch.items()}

        # Vorhersagen und Loss berechnen
        outputs = model(**batch)
        loss = outputs.loss

        # Gradienten zurücksetzen, Backpropagation, Optimizer-Schritt
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

        # Fortschritt anzeigen
        if (i + 1) % 10 == 0 or (i + 1) == len(train_loader):
            print(f"    Batch {i + 1}/{len(train_loader)}, Loss: {loss.item():.4f}")

    avg_loss = total_loss / len(train_loader)
    epoch_end_time = time.time()  # Endzeit pro Epoche
    epoch_time = epoch_end_time - epoch_start_time
    print(f"Epoch-Time: {epoch_time:.2f} Sekunden")
    print(f"===> Epoche {epoch + 1} abgeschlossen, Durchschnittlicher Loss: {avg_loss:.4f}\n")

print("Training abgeschlossen!")

# Endzeit speichern
end_time = time.time()

# Berechnete Zeit
training_time = end_time - start_time
print(f"Gesamtzeit für das Training: {training_time:.2f} Sekunden")

print("=" * 50)

# Validierung
print("\nStarte Validierung...")
model.eval()  # Modell in den Evaluierungsmodus setzen
total_correct = 0
total_samples = 0

with torch.no_grad():
    for i, batch in enumerate(val_loader):
        batch = {k: v.to(device) for k, v in batch.items()}
        outputs = model(**batch)

        # Vorhersagen und Genauigkeit berechnen
        predictions = torch.argmax(outputs.logits, dim=-1)
        total_correct += (predictions == batch['labels']).sum().item()
        total_samples += batch['labels'].size(0)

    accuracy = total_correct / total_samples
    print(f"Validation Accuracy: {accuracy:.4f}\n")

print("=" * 50)
# Testen
print("Starte Test...")
model.eval()
total_correct = 0
total_samples = 0

with torch.no_grad():
    for i, batch in enumerate(test_loader):
        batch = {k: v.to(device) for k, v in batch.items()}
        outputs = model(**batch)
        predictions = torch.argmax(outputs.logits, dim=-1)
        total_correct += (predictions == batch['labels']).sum().item()
        total_samples += batch['labels'].size(0)

test_accuracy = total_correct / total_samples
print(f"Test Accuracy: {test_accuracy:.4f}")
print("=" * 50)

# Modell speichern
save_path = "saved_model"
print(f"Speichere Modell nach '{save_path}'...")
model.save_pretrained(save_path)
tokenizer.save_pretrained(save_path)
print("Modell erfolgreich gespeichert!")
