import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta, UTC
import random
from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(__file__), '../../../.env')
load_dotenv(dotenv_path=dotenv_path)

# DB connection config
DB_CONFIG = {
    "dbname": os.environ["PG_DB_DATABASE"],
    "user": os.environ["PG_DB_USER"],
    "password": os.environ["PG_DB_PASSWORD"],
    "host": os.environ["PG_DB_HOST"],
    "port": int(os.environ["PG_DB_PORT"]),
}

print(DB_CONFIG)

ROOMS = ["shower1", "shower2", "kitchen"]
TYPES = ["hot", "cold"]
DORM_ID = 1  # Change this if you're testing for another dorm

def generate_fake_data(days=2):
    print("generate data")
    data = []
    now = datetime.now(UTC)
    for i in range(days):
        day = now - timedelta(days=i)
        room = random.choice(ROOMS)
        water_type = random.choice(TYPES)
        amount = random.randint(60, 130)
        timestamp = day.replace(
            hour=random.randint(0, 23),
            minute=random.randint(0, 59),
            second=random.randint(0, 59),
            microsecond=random.randint(0, 999999)
        )
        data.append((room, water_type, amount, timestamp.isoformat(), DORM_ID))
    return data

def ensure_table_exists(conn):
    create_query = """
    CREATE TABLE IF NOT EXISTS WaterUsage (
        id SERIAL PRIMARY KEY,
        room VARCHAR(50),
        type VARCHAR(10),
        amount INT,
        timestamp TIMESTAMPTZ,
        dorm_id INT
    );
    """
    with conn.cursor() as cur:
        cur.execute(create_query)
        print("✅ Ensured 'WaterUsage' table exists.")

def insert_data():
    data = generate_fake_data()
    query = """
        INSERT INTO WaterUsage (room, type, amount, timestamp, dorm_id)
        VALUES %s
    """
    conn = None
    try:
        print("connection")
        conn = psycopg2.connect(**DB_CONFIG)

        with conn:
            ensure_table_exists(conn)
            with conn.cursor() as cur:
                execute_values(cur, query, data)
                print(f"✅ Inserted {len(data)} records into WaterUsage.")
    except Exception as e:
        print("❌ Error:", e)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    insert_data()
