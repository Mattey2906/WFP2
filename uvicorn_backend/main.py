from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Uvicorn Server!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}


from pydantic import BaseModel
from fastapi import FastAPI
from typing import List, Optional

app = FastAPI()

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

class QueryParameter(BaseModel):
    parameter_name: str
    parameter_value: str

class SQLAnalysisRequest(BaseModel):
    query: str  # Die SQL-Query
    model_selection: str  # Das ausgewählte Modell für die Analyse
    parameters: Optional[List[QueryParameter]] = None  # Optional: Zusätzliche Parameter der Query

@app.post("/analyze-sql")
async def analyze_sql_query(request: SQLAnalysisRequest):
    # Zugriff auf query und model_selection
    query = request.query
    model_selection = request.model_selection

    # Verarbeite Parameter, wenn vorhanden
    processed_parameters = {}
    if request.parameters:
        processed_parameters = {
            param.parameter_name: f"Received: {param.parameter_value}" for param in request.parameters
        }

    return {
        "message": "SQL analysis completed successfully!",
        "query": query,
        "model_selection": model_selection,
        "processed_parameters": processed_parameters
    }
