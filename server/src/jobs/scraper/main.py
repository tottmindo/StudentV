import destinationuppsala
import db

if __name__ == "__main__":
    events = destinationuppsala.destUppScraper()

    print(f"Found {len(events)} events")

    db.toDB(events)

    print("Database updated")