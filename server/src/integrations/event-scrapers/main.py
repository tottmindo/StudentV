import destinationuppsala
import db
import nationsguiden
from datetime import datetime, timedelta

def getDateRange(days: int):
    today = datetime.today()

    return[ (today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]

if __name__ == "__main__":
    duEvents = destinationuppsala.destUppScraper()

    print(f"Found {len(duEvents)} Destination Uppsala events")

    db.toDBDestinationUppsala(duEvents)

    print("externalevents updated")

    dateSpan = getDateRange(7)

    nuEvents = nationsguiden.scrapeTimespan(dateSpan)

    print(f"Found {len(nuEvents)} Nations Guiden events")

    parsed = nationsguiden.parseEvents(nuEvents)

    db.toDBNationsguiden(parsed)

    print("nationsguidenevents updated")

