import os
import psycopg
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def toDateTime(date: str):
    if not date:
        return None

    SWEDISH_MONTHS = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "maj": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dec": 12
    }

    parts = date.strip().split()
    if len(parts) < 2:
        return None 

    day = int(parts[0])
    month_str = parts[1].lower()[:3] 
    month = SWEDISH_MONTHS.get(month_str)

    if not month:
        return None

    now = datetime.now()
    current_year = now.year

    if (month, day) < (now.month, now.day):
        current_year += 1

    return datetime(current_year, month, day)


def dateComparison(start: datetime, end: datetime):
    if not start or not end:
        return end

    if end < start:
        end = end.replace(year=start.year + 1)

    return end


def toDB(events: list):
    if not events:
        return

    # Psycopg 3 uses %s for placeholders
    query = """
    INSERT INTO externalevents
        (externalURL, title, startDate, endDate, lastSeen, updatedAt) 
    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (externalURL) DO UPDATE SET
        title = EXCLUDED.title,
        startDate = EXCLUDED.startDate,
        endDate = EXCLUDED.endDate,
        lastSeen = CURRENT_TIMESTAMP,
        updatedAt = CASE 
            WHEN externalevents.title IS DISTINCT FROM EXCLUDED.title
              OR externalevents.startDate IS DISTINCT FROM EXCLUDED.startDate
              OR externalevents.endDate IS DISTINCT FROM EXCLUDED.endDate
            THEN CURRENT_TIMESTAMP
            ELSE externalevents.updatedAt
        END;
    """

    params = []
    for event in events:
        start_dt = toDateTime(event.get("startDate"))
        end_dt = toDateTime(event.get("endDate"))
        
        params.append((
            event["url"],
            event["title"],
            start_dt,
            dateComparison(start_dt, end_dt)
        ))

    try:
        # Connect using psycopg (v3)
        with psycopg.connect(
            user=os.getenv('PG_DB_USER'),
            host=os.getenv('PG_DB_HOST_PYTHON'),
            password=os.getenv('PG_DB_PASSWORD'),
            dbname=os.getenv('PG_DB_DATABASE'),
            port=os.getenv('PG_DB_PORT', '5432'),
            sslmode='require'
        ) as conn:
            with conn.cursor() as cursor:
                # executemany in Psycopg 3 is optimized and fast by default
                cursor.executemany(query, params)
            conn.commit()

    except Exception as e:
        print(f"Database error: {e}")
        raise

""" # --- Quick Manual Tests ---

# 1. Standard future date in current year
print("1.", toDateTime("7 nov"), "| Expected: 2026-11-07 00:00:00")

# 2. Past month (rolls over to next year)
print("2.", toDateTime("24 jan"), "| Expected: 2027-01-24 00:00:00")

# 3. Invalid/missing string safety check
print("3.", toDateTime("invalid"), "| Expected: None")

# 4. Same-year event range check (10 May -> 20 May)
start_1 = toDateTime("10 maj")
end_1 = toDateTime("20 maj")
print("4.", dateComparison(start_1, end_1), "| Expected: 2027-05-20 00:00:00")

# 5. New Year's rollover event range check (7 Nov 2026 -> 24 Jan 2026 becomes 2027)
start_2 = toDateTime("7 nov")
end_2 = toDateTime("24 jan")
print("5.", dateComparison(start_2, end_2), "| Expected: 2027-01-24 00:00:00") """