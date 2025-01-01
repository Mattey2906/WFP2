# venv aktivieren:
source ~/Projects/FH\ Campus\ Wien/WFP2/uvicorn_backend/venv-linux/bin/activate


# Server starten: in uvicorn_backend
uvicorn main:app --reload --host 127.0.0.1 --port 8001

# Swagger
http://127.0.0.1:8001/docs

# ReDoc
http://127.0.0.1:8001/redoc