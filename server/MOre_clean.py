import pandas as pd

# If your data is CSV-like text:
df = pd.read_csv(
    "cleaned.csv",
    header=None,
    names=["timestamp", "client_id", "installation_id", "topic", "value", "msg"]
)

# -----------------------------
# 1. Convert UNIX timestamp
# -----------------------------
df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")
df = df.dropna(subset=["timestamp"])

df["datetime"] = pd.to_datetime(df["timestamp"], unit="s")

# -----------------------------
# 2. Extract unit_id + type
# -----------------------------
def parse_topic(topic):
    # expected: 1637/obj/lora/<unit_id>/<type>

    parts = str(topic).split("/")

    unit_id = None
    value_type = None

    try:
        # find "lora" position
        i = parts.index("lora")
        unit_id = parts[i + 1] if len(parts) > i + 1 else None
        value_type = parts[i + 2] if len(parts) > i + 2 else "unknown"
    except ValueError:
        unit_id = None
        value_type = "unknown"

    # clean edge case: trailing slash or empty string
    if value_type == "" or value_type is None:
        value_type = "unknown"

    return pd.Series([unit_id, value_type])

df[["unit_id", "value_type"]] = df["topic"].apply(parse_topic)

# -----------------------------
# 3. Optional cleanup
# -----------------------------
df["value"] = pd.to_numeric(df["value"], errors="coerce")

# remove junk rows like topic ending in just "/"
df = df[df["value_type"] != "unknown"]

# -----------------------------
# 4. Reorder columns nicely
# -----------------------------
df = df[[
    "datetime",
    "unit_id",
    "value_type",
    "value",
    "client_id",
    "installation_id",
    "msg"
]]

# -----------------------------
# 5. Save cleaned dataset
# -----------------------------
df.to_csv("cleaned_structured.csv", index=False)

print(df.head())