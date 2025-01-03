import torch
import transformers
import pandas as pd
from sklearn.model_selection import train_test_split
import os

# Bibliotheken-Versionen anzeigen
print("=" * 60)
print("🔧 Bibliotheken-Versionen:")
print("-" * 60)
print(f"Torch Version:         {torch.__version__}")
print(f"Transformers Version:  {transformers.__version__}")
print(f"Pandas Version:        {pd.__version__}")
print("=" * 60)

# Lade den Datensatz
from config import file_path
from config import encoding_type
df = pd.read_csv(file_path, encoding=encoding_type)

# Zeige die ersten Zeilen des Datensatzes
print("\n" + "=" * 60)
print(" Erste Zeilen des Datensatzes:")
print("-" * 60)
print(df.head())
print("=" * 60)

# Zeige allgemeine Informationen über den Datensatz
print("\n" + "=" * 60)
print("📊 Allgemeine Informationen:")
print("-" * 60)
df.info()
print("=" * 60)

# Zeige die Anzahl der Zeilen und Spalten
print("\n" + "=" * 60)
print("📋 Anzahl der Zeilen und Spalten:")
print("-" * 60)
print(f"Anzahl der Zeilen:    {len(df)}")
print(f"Anzahl der Spalten:   {len(df.columns)}")
print("=" * 60)

# Zähle die Labels
print("\n" + "=" * 60)
print(" Verteilung der Labels:")
print("-" * 60)
print(df['label'].value_counts())
print("=" * 60)

# Prozentuale Verteilung der Labels
print("\n" + "=" * 60)
print(" Prozentuale Verteilung der Labels:")
print("-" * 60)
print(df['label'].value_counts(normalize=True) * 100)
print("=" * 60)

# Fehlende Werte prüfen und entfernen
print("\n" + "=" * 60)
print(" Fehlende Werte prüfen:")
print("-" * 60)
print(df.isnull().sum())
df = df.dropna()
print("\n✅ Fehlende Werte entfernt.")
print("=" * 60)

# Leere Einträge in der 'text'-Spalte prüfen und entfernen
print("\n" + "=" * 60)
print(" Leere Einträge prüfen:")
print("-" * 60)
empty_text_count = df['text'].str.strip().eq('').sum()
print(f"Leere Einträge: {empty_text_count}")
df = df[df['text'].str.strip() != '']
print("✅ Leere Einträge entfernt.")
print("=" * 60)

# Duplikate prüfen und entfernen
print("\n" + "=" * 60)
print(" Duplikate prüfen:")
print("-" * 60)
duplicate_count = df.duplicated().sum()
print(f"Anzahl der Duplikate: {duplicate_count}")
df = df.drop_duplicates()
print("✅ Duplikate entfernt.")
print("=" * 60)

# Datenaufteilung (70% Train, 20% Test, 10% Val)
print("\n" + "=" * 60)
print(" Datenaufteilung (70% Train, 20% Test, 10% Val):")
print("-" * 60)
train, test = train_test_split(df, test_size=0.3, random_state=42)
val, test = train_test_split(test, test_size=0.67, random_state=42)
print(f"Train: {len(train)}")
print(f"Val:   {len(val)}")
print(f"Test:  {len(test)}")
print("=" * 60)

# Speichern der bereinigten und aufgeteilten Daten
output_dir = "data/processed/"
os.makedirs(output_dir, exist_ok=True)

train.to_csv(os.path.join(output_dir, "train.csv"), index=False)
val.to_csv(os.path.join(output_dir, "val.csv"), index=False)
test.to_csv(os.path.join(output_dir, "test.csv"), index=False)

# Ausgabe nach dem Speichern
print("\n" + "=" * 60)
print("💾 Datensätze gespeichert:")
print("-" * 60)
print(f"Train: {output_dir}train.csv")
print(f"Val:   {output_dir}val.csv")
print(f"Test:  {output_dir}test.csv")
print("=" * 60)
