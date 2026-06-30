import json
import pandas as pd

INPUT_FILE = "data.json"
OUTPUT_FILE = "cleaned.csv"

def load_json_safely(path):
    """
    Handles slightly corrupted/truncated JSON by attempting a repair.
    If file is valid JSON, loads normally.
    """
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read().strip()

    # Try normal load first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # fallback: try trimming incomplete tail
        print("Warning: JSON malformed, attempting partial repair...")

        # crude repair: cut off last incomplete object
        last_brace = raw.rfind("}")
        fixed = raw[:last_brace + 1] + "]}"

        return json.loads(fixed)

def clean_records(payload):
    records = payload.get("data", [])

    cleaned = []
    for r in records:
        cleaned.append({
            "timestamp": r.get("timestamp"),
            "client_id": r.get("client_id"),
            "installation_id": r.get("installation_id"),
            "topic": r.get("topic"),
            "value": r.get("value"),
            "msg": r.get("msg", None)
        })

    return cleaned

def main():
    payload = load_json_safely(INPUT_FILE)
    cleaned = clean_records(payload)

    df = pd.DataFrame(cleaned)

    # Optional: sort by time
    df = df.sort_values("timestamp")

    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved cleaned data to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()