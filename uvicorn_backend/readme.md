# venv aktivieren:
.\venv\Scripts\Activate

# Server starten: 
uvicorn main:app --reload --host 127.0.0.1 --port 8001

# Swagger
http://127.0.0.1:8001/docs

# ReDoc
http://127.0.0.1:8001/redoc