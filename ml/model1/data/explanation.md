# 1. Preprocessing

## Daten einlesen
df === Pandas DataFrame

Es ist eine tabellen Datenstruktur. 

* Flexibilität: Einfaches Filtern, Gruppieren, und Manipulieren von Daten.
* Integration: Kompatibel mit vielen Python-Bibliotheken.

```
text,label
"SELECT * FROM users WHERE id = 1 UNION SELECT username, password FROM admins --comment-8130;",1
```
Das ist eine Beispiel CSV. text, label wären die zwei Spalten namen der Tabelle. Die Zeile darunter wären
die ersten Einträge in Zeile 1.

im CSV-Format werden Spalten standardmäßig durch Kommas `,` getrennt.

---

## Datenaufteilung

```python
print(" Datenaufteilung (70% Train, 20% Test, 10% Val):")
train, test = train_test_split(df, test_size=0.3, random_state=42)
val, test = train_test_split(test, test_size=0.67, random_state=42)
```

* random_state sorgt für Reproduzierbarkeit. 
* Es ist ein Seed für den Zufallsgenerator, damit die Aufteilung bei jedem Run gleich bleibt.

### Train, Val, Test

* Train (70%): Zum Trainieren des Modells.
* Validation (20%): Zur Optimierung von Hyperparametern und zur Überprüfung der Leistung während des Trainings.
* Test (10%): Zur endgültigen Bewertung der Modellqualität auf unbekannten Daten.

## Datenspeicherung

# Speichern der bereinigten und aufgeteilten Daten

```python
output_dir = "data/processed/"
os.makedirs(output_dir, exist_ok=True)

train.to_csv(os.path.join(output_dir, "train.csv"), index=False)
val.to_csv(os.path.join(output_dir, "val.csv"), index=False)
test.to_csv(os.path.join(output_dir, "test.csv"), index=False)
```
1. erstellt ein Verzeichnis, falls es noch nicht existiert
   * `exist_ok=True` verhindert Error, wenn es existiert.
   

2. beim Speichern mit to_csv wird die existierende Datei überschrieben
   * `index=False`  Index (Zeilen-ID) des DataFrames beim Export in die CSV-Datei nicht gespeichert.
   * Es gibt im File also dann keine ID Spalte. Im DF gibt es standardm. eine ID Spalte.

# 2. Trainingsvorbereitung

## Tokenisierung

```python
# Tokenizer laden
model_name = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Tokenisierung der Daten
def tokenize_data(data):
    return tokenizer(
        data['text'].tolist(),
        padding=True,
        truncation=True,
        max_length=max_length, 
        return_tensors="pt"
    )

train_tokens = tokenize_data(train_data)
val_tokens = tokenize_data(val_data)
test_tokens = tokenize_data(test_data)
```

`data['text'].tolist():`
* Konvertiert die Spalte text eines DataFrames in eine Liste von Strings, damit der Tokenizer sie verarbeiten kann.

`padding=True:`
* Ergänzt kürzere Sequenzen mit Padding-Tokens ([PAD]), damit alle Sequenzen die gleiche Länge haben.

`truncation=True:`
* Schneidet längere Sequenzen ab.

`max_length=max_length:`
* Gibt die maximale Länge der Sequenzen in Token an. Kürzere Sequenzen werden gepaddet, längere abgeschnitten.

`return_tensors="pt":`
* Gibt die tokenisierten Daten als PyTorch-Tensoren zurück, die direkt für Modelle genutzt werden können.

# 3. Ressourcen Optimierung

