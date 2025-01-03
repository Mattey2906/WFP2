from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Modell und Tokenizer laden
model_path = "/home/matthias/Projects/FH Campus Wien/WFP2/ml/model1/saved_model"  # Pfad zum gespeicherten Modell
model = AutoModelForSequenceClassification.from_pretrained(model_path)
tokenizer = AutoTokenizer.from_pretrained(model_path)

# Modell auf CPU setzen
device = torch.device("cpu")
model.to(device)
model.eval()


# Klassifikationsfunktion
def classify_sql_query(query):
    # Eingabe tokenisieren
    inputs = tokenizer(
        query,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512  # Modellbeschränkung
    ).to(device)

    # Vorhersage machen
    with torch.no_grad():
        outputs = model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=-1)
        prediction = torch.argmax(probabilities, dim=-1).item()

    return prediction, probabilities


# Hauptprogramm
if __name__ == "__main__":
    print("SQL-Injection-Erkennung gestartet. Geben Sie eine SQL-Query ein.")
    print("Schreiben Sie 'exit', um das Programm zu beenden.\n")

    while True:
        user_input = input("SQL Query: ")

        if user_input.lower() in ["exit", "quit"]:
            print("Programm beendet.")
            break

        # Klassifikation
        prediction, probs = classify_sql_query(user_input)

        if prediction == 1:
            print(f"Gefährlich! Wahrscheinlichkeit: {probs[0][1].item():.4f}")
        else:
            print(f"Harmlos. Wahrscheinlichkeit: {probs[0][0].item():.4f}")
