import sqlite3, json, os, base64

db_path = os.path.expanduser("~/.compass/compass.db")
out_file = "compass_snapshot.json"

def safe_value(value):
    """Convert any SQLite value into a JSON-serializable form."""
    if isinstance(value, bytes):
        # Encode binary data as base64 so it's JSON-safe
        return {"__bytes__": base64.b64encode(value).decode("utf-8")}
    elif isinstance(value, (list, tuple)):
        return [safe_value(v) for v in value]
    elif isinstance(value, dict):
        return {k: safe_value(v) for k, v in value.items()}
    return value

def snapshot_sqlite(db_path, out_file, row_limit=None):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    snapshot = {"tables": {}}

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]

    for table in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        schema = [
            {
                "cid": col[0],
                "name": col[1],
                "type": col[2],
                "notnull": col[3],
                "default": col[4],
                "pk": col[5]
            }
            for col in cursor.fetchall()
        ]

        query = f"SELECT * FROM {table}"
        if row_limit:
            query += f" LIMIT {row_limit}"
        cursor.execute(query)
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]

        serialized_rows = []
        for row in rows:
            serialized_row = {}
            for col_name, value in zip(col_names, row):
                serialized_row[col_name] = safe_value(value)
            serialized_rows.append(serialized_row)

        snapshot["tables"][table] = {
            "schema": schema,
            "rows": serialized_rows
        }

    conn.close()
    with open(out_file, "w") as f:
        json.dump(snapshot, f, indent=2)

# Limit rows for readability, set to None for full export
snapshot_sqlite(db_path, out_file, row_limit=100)
