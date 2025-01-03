import pandas as pd

# Datei-Pfade definieren
train_file = "data/processed/train.csv"
val_file = "data/processed/val.csv"
test_file = "data/processed/test.csv"

# Daten laden
train_data = pd.read_csv(train_file)
val_data = pd.read_csv(val_file)
test_data = pd.read_csv(test_file)

# Daten prüfen
print(f"Train-Daten geladen: {len(train_data)} Einträge")
print(f"Val-Daten geladen:   {len(val_data)} Einträge")
print(f"Test-Daten geladen:  {len(test_data)} Einträge")

print("\n" + "=" * 60)

from transformers import AutoTokenizer
from config import model_name

# Tokenizer laden
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Maximale Token-Länge in allen Datensätzen prüfen
train_token_lengths = [len(tokenizer.encode(text, truncation=True, max_length=512)) for text in train_data['text']]
val_token_lengths = [len(tokenizer.encode(text, truncation=True, max_length=512)) for text in val_data['text']]
test_token_lengths = [len(tokenizer.encode(text, truncation=True, max_length=512)) for text in test_data['text']]

# Maximale Länge begrenzen
max_length = min(max(max(train_token_lengths), max(val_token_lengths), max(test_token_lengths)), 512)
print(f"Maximale Token-Länge über alle Datensätze (begrenzt auf 512): {max_length}")

print("\n" + "=" * 60)

# Tokenisierung der Daten
def tokenize_data(data):
    return tokenizer(
        data['text'].tolist(),
        padding=True,
        truncation=True,
        max_length=max_length, #max_length
        return_tensors="pt"
    )

train_tokens = tokenize_data(train_data)
val_tokens = tokenize_data(val_data)
test_tokens = tokenize_data(test_data)

import torch

# Speichern der Tokens
torch.save(train_tokens, "data/processed/train_tokens.pt")
torch.save(val_tokens, "data/processed/val_tokens.pt")
torch.save(test_tokens, "data/processed/test_tokens.pt")

# Labels extrahieren
train_labels = train_data['label'].tolist()
val_labels = val_data['label'].tolist()
test_labels = test_data['label'].tolist()

# Labels speichern
torch.save(train_labels, "data/processed/train_labels.pt")
torch.save(val_labels, "data/processed/val_labels.pt")
torch.save(test_labels, "data/processed/test_labels.pt")

print("Tokenisierung abgeschlossen.")