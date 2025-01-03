from faker import Faker
import random
import pandas as pd

# Faker-Instanz erstellen
faker = Faker()

# Templates für SQL-Queries
query_templates = [
    "SELECT {columns} FROM {table} WHERE {conditions};",
    "SELECT {columns} FROM {table} WHERE {conditions} ORDER BY {columns};",
    "INSERT INTO {table} ({columns}) VALUES ({values});",
    "UPDATE {table} SET {updates} WHERE {conditions};",
    "DELETE FROM {table} WHERE {conditions};",
    "SELECT {columns} FROM {table1} JOIN {table2} ON {join_condition} WHERE {conditions};",
    "SELECT {columns} FROM {table} WHERE EXISTS (SELECT 1 FROM {table} WHERE {subquery_condition});",
    "SELECT COUNT({columns}) FROM {table} WHERE {conditions};",
    "SELECT {columns} FROM {table} GROUP BY {group_by} HAVING {conditions};"
]

# Funktion für gutartige Eingaben
def generate_good_input():
    return {
        "columns": ", ".join([faker.word() for _ in range(random.randint(1, 3))]),
        "table": faker.word(),
        "table1": faker.word(),
        "table2": faker.word(),
        "join_condition": f"{faker.word()}.{faker.word()} = {faker.word()}.{faker.word()}",
        "conditions": f"{faker.word()} = {faker.random_int(1, 100)}",
        "values": ", ".join([f"'{faker.word()}'" for _ in range(random.randint(1, 3))]),
        "updates": ", ".join([f"{faker.word()} = '{faker.word()}'" for _ in range(random.randint(1, 3))]),
        "group_by": faker.word(),
        "subquery_condition": f"{faker.word()} = {faker.random_int(1, 100)}"
    }

# Funktion für bösartige Eingaben
def generate_bad_input():
    injections = [
        "' OR 1=1 --",
        "'; DROP TABLE users; --",
        "' UNION SELECT NULL, username, password FROM admin --",
        "' AND SLEEP(5)--",
        "'; EXEC xp_cmdshell('dir'); --"
    ]
    return {
        "columns": "*",
        "table": faker.word(),
        "table1": faker.word(),
        "table2": faker.word(),
        "join_condition": random.choice(injections),
        "conditions": random.choice(injections),
        "values": ", ".join([f"'{faker.word()}'" for _ in range(random.randint(1, 3))]),
        "updates": ", ".join([f"{faker.word()} = {random.choice(injections)}" for _ in range(random.randint(1, 3))]),
        "group_by": faker.word(),
        "subquery_condition": random.choice(injections)
    }

# Funktion zum Generieren von SQL-Queries
def create_sql_queries(num_queries=10000):
    queries = []
    for _ in range(num_queries):
        # Zufälliges Template auswählen
        template = random.choice(query_templates)
        # Zufällig gutartige oder bösartige Eingaben einfügen
        if random.random() > 0.5:
            inputs = generate_good_input()
            label = 0  # Gutartig
        else:
            inputs = generate_bad_input()
            label = 1  # Bösartig
        # Query generieren und zur Liste hinzufügen
        text = template.format(**inputs)
        queries.append({"text": text, "label": label})
    return queries

# Generiere 10.000 Queries
sql_queries = create_sql_queries(10000)

# In DataFrame umwandeln und als CSV speichern
df = pd.DataFrame(sql_queries)
df.to_csv("large_sql_dataset.csv", index=False)

print("10.000 SQL-Queries wurden erfolgreich generiert und in 'large_sql_dataset.csv' gespeichert.")
