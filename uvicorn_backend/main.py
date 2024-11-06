from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Uvicorn Server!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}


class InputData(BaseModel):
    field_name: str  # Der Name des Eingabefelds
    field_value: str  # Der Wert des Eingabefelds


class DynamicFormData(BaseModel):
    inputs: List[InputData]  # Eine Liste von InputData-Objekten


@app.post("/submit")
async def handle_dynamic_form_data(form_data: DynamicFormData):
    processed_data = {}

    for input_item in form_data.inputs:
        processed_data[input_item.field_name] = f"Received: {input_item.field_value}"

    return {"message": "Form data processed successfully!", "processed_data": processed_data}