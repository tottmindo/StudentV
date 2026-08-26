import os
import psycopg
from dotenv import load_dotenv
from datetime import datetime
from zoneinfo import ZoneInfo

load_dotenv()

STOCKHOLM = ZoneInfo("Europe/Stockholm")


def _dateParts(date: str):
    if not date:
        return None

    SWEDISH_MONTHS = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "maj": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dec": 12
    }

    parts = date.strip().split()
    if len(parts) < 2:
        return None 

    try:
        day = int(parts[0])
    except ValueError:
        return None
    month_str = parts[1].lower()[:3] 
    month = SWEDISH_MONTHS.get(month_str)

    if not month:
        return None

    return day, month


def toDateTime(date: str, now: datetime | None = None):
    parsed = _dateParts(date)
    if not parsed:
        return None

    day, month = parsed
    now = now or datetime.now(STOCKHOLM)
    current_year = now.year

    if (month, day) < (now.month, now.day):
        current_year += 1

    return datetime(current_year, month, day, tzinfo=STOCKHOLM)


def toDateRange(start_date: str, end_date: str, now: datetime | None = None):
    """Resolve an ambiguous Swedish date range without moving ongoing events ahead a year."""
    now = now or datetime.now(STOCKHOLM)
    start_parts = _dateParts(start_date)
    end_parts = _dateParts(end_date)
    if not start_parts or not end_parts:
        return None, None

    try:
        start = datetime(now.year, start_parts[1], start_parts[0], tzinfo=STOCKHOLM)
        end = datetime(now.year, end_parts[1], end_parts[0], tzinfo=STOCKHOLM)
    except ValueError:
        return None, None
    if end < start:
        end = end.replace(year=end.year + 1)
        # A Nov-Oct listing seen in August is the currently running interval,
        # not the occurrence beginning next November.
        previous_start = start.replace(year=start.year - 1)
        previous_end = end.replace(year=end.year - 1)
        if previous_start.date() <= now.date() <= previous_end.date():
            return previous_start, previous_end
    if end.date() < now.date():
        start = start.replace(year=start.year + 1)
        end = end.replace(year=end.year + 1)
    return start, end


def toDBDestinationUppsala(events: list):
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
        start_dt, end_dt = toDateRange(event.get("startDate"), event.get("endDate"))
        
        params.append((
            event["url"],
            event["title"],
            start_dt,
            end_dt
        ))

    try:
        # Connect using psycopg (v3)
        with connect() as conn:
            with conn.cursor() as cursor:
                # executemany in Psycopg 3 is optimized and fast by default
                cursor.executemany(query, params)
            conn.commit()

    except Exception as e:
        print(f"Database error: {e}")
        raise

def toDBNationsguiden(events: list):
    if not events:
        return

    update_query = """UPDATE nationsguideevents SET title = %s, endDate = %s,
        category = %s, organiser = %s WHERE externalURL = %s AND startDate = %s"""
    insert_query = """INSERT INTO nationsguideevents
        (title, startDate, endDate, category, externalURL, organiser)
        VALUES (%s, %s, %s, %s, %s, %s)"""

    try:
        with connect() as conn:

            with conn.cursor() as cursor:
                for event in events:
                    common = (
                        event.get("title"), event.get("endDate"),
                        event.get("category"), event.get("organiser"),
                    )
                    cursor.execute(update_query, common + (event["url"], event["startDate"]))
                    if cursor.rowcount == 0:
                        cursor.execute(insert_query, (
                            event.get("title"), event["startDate"], event.get("endDate"),
                            event.get("category"), event["url"], event.get("organiser"),
                        ))

            conn.commit()

    except Exception as e:
        print(f"Database error: {e}")
        raise


def connect():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg.connect(database_url)

    host = os.getenv("PG_DB_HOST_PYTHON") or os.getenv("PG_DB_HOST")
    required = {
        "PG_DB_USER": os.getenv("PG_DB_USER"),
        "PG_DB_HOST_PYTHON or PG_DB_HOST": host,
        "PG_DB_PASSWORD": os.getenv("PG_DB_PASSWORD"),
        "PG_DB_DATABASE": os.getenv("PG_DB_DATABASE"),
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise RuntimeError(f"Missing database configuration: {', '.join(missing)}")

    return psycopg.connect(
        user=required["PG_DB_USER"], host=host,
        password=required["PG_DB_PASSWORD"], dbname=required["PG_DB_DATABASE"],
        port=os.getenv("PG_DB_PORT", "5432"),
        sslmode=os.getenv("PG_SSLMODE", "require"),
    )
