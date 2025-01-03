#!/bin/bash

# Virtual Environment aktivieren
source "/home/matthias/Projects/FH Campus Wien/WFP2/ml/venv-ml/bin/activate"

# Skripte ausführen
python ../preprocessing.py
python ../tokenization.py
python ../train.py

# Optional: Virtual Environment deaktivieren
deactivate


