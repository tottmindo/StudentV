import json
import re
import requests
from datetime import datetime, timedelta

NATIONSGUIDEN_URL = "https://www.nationsguiden.se/"

def getNationsguidenConfig():
    response = requests.get(NATIONSGUIDEN_URL)
    response.raise_for_status()

    match = re.search(
        r'var\s+DI_FILTER_EVENTS\s*=\s*(\{.*?\});',
        response.text
    )

    if not match:
        raise RuntimeError("Did not find DI_FILTER_EVENTS")

    config = json.loads(match.group(1))

    return config["ajaxurl"], config["nonce"]


def scrapeDate(selected_date: str, ajax_url: str, nonce: str):
    data = {
        "action": "di_filter_events",
        "nonce": nonce,
        "selected_date": selected_date,
        "only_load_dates": "false",
    }

    response = requests.post(
        ajax_url,
        data=data
    )

    response.raise_for_status()

    result = response.json()

    categories = json.loads(result["event_categories"])

    events = []

    for category in categories:
        category_name = category.get("title")

        for event in category.get("events", []):
            events.append({
                "date": selected_date,
                "category": category_name,
                "title": event.get("title"),
                "schedule": event.get("schedule"),
                "url": event.get("permalink"),
                "organiser": event.get("organiser", {}).get("title"),
            })

    return events

def scrapeTimespan(dates: list[str]):
    ajax_url, nonce = getNationsguidenConfig()

    events = []

    for selected_date in dates:
        day_events = scrapeDate(
            selected_date,
            ajax_url,
            nonce
        )

        events.extend(day_events)

    return events

def parseSchedule(event: dict):
    schedule = event.get("schedule")
    date = event.get("date")

    if not schedule or not date:
        return None, None

    match = re.search(
        r'(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})',
        schedule
    )

    if not match:
        return None, None

    start_hour = int(match.group(1))
    start_minute = int(match.group(2))

    end_hour = int(match.group(3))
    end_minute = int(match.group(4))

    event_date = datetime.strptime(
        date,
        "%Y-%m-%d"
    )

    start = event_date.replace(
        hour=start_hour,
        minute=start_minute,
        second=0,
        microsecond=0
    )

    end = event_date.replace(
        hour=end_hour,
        minute=end_minute,
        second=0,
        microsecond=0
    )

    if end <= start:
        end += timedelta(days=1)

    return start, end

def parseEvent(event: dict):
    start, end = parseSchedule(event)

    if start is None:
        return None

    return {
        "title": event.get("title"),
        "startDate": start,
        "endDate": end,
        "category": event.get("category"),
        "url": event.get("url"),
        "organiser": event.get("organiser"),
    }

def parseEvents(events: list):
    parsed_events = []

    for event in events:
        parsed = parseEvent(event)

        if parsed is not None:
            parsed_events.append(parsed)

    return parsed_events

