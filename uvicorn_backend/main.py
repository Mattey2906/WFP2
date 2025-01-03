from pydantic import BaseModel
from fastapi import FastAPI
from typing import List, Optional
from datetime import datetime, timedelta
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import logging

# Logger konfigurieren
logging.basicConfig(level=logging.INFO)  # Setzt die Logging-Ebene auf INFO
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Uvicorn Server!"}

server_start_time = datetime.now()

@app.get("/health")
def health_check():
    # Berechne die Uptime
    current_time = datetime.now()
    uptime = current_time - server_start_time
    # Lesbares Format
    days = uptime.days
    hours, remainder = divmod(uptime.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    uptime_str = f"{days}d {hours}h {minutes}m {seconds}s" if days > 0 else f"{hours}h {minutes}m {seconds}s"

    return {
        "status": "ok",
        "message": "Uvicorn server is running.",
        "uptime": uptime_str
    }


# Gerät konfigurieren
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model_paths = {
    "model1": "./model1",
    "model2": "./model2"
}
models = {
    name: AutoModelForSequenceClassification.from_pretrained(path).to(device)
    for name, path in model_paths.items()
}
tokenizers = {
    name: AutoTokenizer.from_pretrained(path)
    for name, path in model_paths.items()
}

# Anfrage-Definition
class SQLParameter(BaseModel):
    parameter_name: str
    parameter_value: str

class SQLAnalysisRequest(BaseModel):
    query: str
    model_selection: str = "model1"
    # Beide Modelle und Tokenizer laden

@app.post("/analyze-sql")
async def analyze_sql_query(request: SQLAnalysisRequest):
    query = request.query
    # logger.info(request.model_selection)

    # Modell basierend auf der Auswahl zuweisen
    if request.model_selection == "1":
        selected_model = "model1"
    elif request.model_selection == "2":
        selected_model = "model2"
    else:
        return {"error": f"Invalid model selection: {request.model_selection}"}

    logger.info(f"Selected Model: {selected_model}")

    # Modell und Tokenizer basierend auf der Auswahl abrufen
    if selected_model not in models:
        return {"error": f"Model '{selected_model}' not found."}

    model = models[selected_model]
    tokenizer = tokenizers[selected_model]

    # Tokenisierung der Eingabe
    inputs = tokenizer(query, return_tensors="pt", truncation=True, padding=True, max_length=512)
    inputs = {key: value.to(device) for key, value in inputs.items()}

    # Modellvorhersage
    with torch.no_grad():
        outputs = model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=-1)
        predicted_class = torch.argmax(probabilities, dim=-1).item()

    # Ergebnisse verarbeiten
    class_labels = model.config.id2label
    human_readable_message = (
        "The query is malicious."
        if predicted_class == 1
        else "The query is benign."
    )

    result = {
        "query": query,
        "predicted_class": class_labels[predicted_class],
        "probabilities": {class_labels[i]: prob.item() for i, prob in enumerate(probabilities[0])},
        "message": human_readable_message
    }

    # Log: Ergebnisse
    logger.info(f"Query: {query}")
    logger.info(f"Predicted Class: {class_labels[predicted_class]}")
    logger.info(f"Probabilities: {result['probabilities']}")

    return result
