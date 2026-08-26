import argparse
import os
from datetime import datetime, timedelta

import db
import destinationuppsala
import nationsguiden

def getDateRange(days: int):
    today = datetime.today()

    return[ (today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]

def runDestinationUppsala():
    duEvents = destinationuppsala.destUppScraper()
    print(f"Found {len(duEvents)} Destination Uppsala events")
    db.toDBDestinationUppsala(duEvents)

    print("Destination Uppsala events updated")


def runNationsguiden():
    dateSpan = getDateRange(int(os.getenv("NATIONSGUIDEN_DAYS", "7")))
    nuEvents = nationsguiden.scrapeTimespan(dateSpan)
    print(f"Found {len(nuEvents)} Nationsguiden events")

    parsed = nationsguiden.parseEvents(nuEvents)
    db.toDBNationsguiden(parsed)
    print(f"Nationsguiden events updated ({len(parsed)} with a valid schedule)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import external events")
    parser.add_argument(
        "source",
        choices=("all", "destinationuppsala", "nationsguiden"),
        nargs="?",
        default="all",
    )
    args = parser.parse_args()

    if args.source in ("all", "destinationuppsala"):
        runDestinationUppsala()
    if args.source in ("all", "nationsguiden"):
        runNationsguiden()
