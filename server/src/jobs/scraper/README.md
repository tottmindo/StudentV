# External Events Scraper

A standalone Python scraper service responsible for collecting external events and storing them in the StudentV database.

The scraper runs independently from the web application. It does not communicate directly with the frontend or backend. Instead, it collects data from external sources, writes the information to the database, and the web application retrieves the stored data separately.

Currently supported sources:

- Destination Uppsala events


## Architecture

The data flow is:

```
External Website
        |
        v
Python Scraper
        |
        v
MySQL Database
        |
        v
StudentV Backend
        |
        v
Frontend
```

The scraper is only responsible for data collection and database updates.


## Features

- Scrapes external event pages
- Stores event information in MySQL
- Automatically inserts new events
- Updates existing events using database upsert logic
- Tracks when events were last seen
- Tracks when event information was changed
- Designed to run automatically on a schedule


## Project Structure

```
scraper/
|
├── main.py                    # Application entry point
├── destinationuppsala.py      # Destination Uppsala scraping logic
├── db.py                      # Database operations
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (not committed)
└── README.md
```


## Requirements

- Python 3.10+
- MySQL database
- Internet connection
- Database credentials


## Installation

### Create virtual environment

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment.

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```


### Install dependencies

Install required Python packages:

```bash
pip install -r requirements.txt
```

## Dependencies

The scraper uses the following packages:

| Package | Purpose |
|---|---|
| requests | Sending HTTP requests |
| beautifulsoup4 | Parsing HTML pages |
| mysql-connector-python | Connecting to MySQL |
| python-dotenv | Loading environment variables |

## Database Behaviour

The scraper uses an upsert strategy when storing events.

When an event is scraped:

- If the event does not exist, it is inserted.
- If the event already exists, the existing row is updated.

The database tracks:

- `lastSeen` - When the scraper last found the event.
- `updatedAt` - When the event information was actually changed.

Example:

| Situation | lastSeen | updatedAt |
|---|---|---|
| New event | Updated | Updated |
| Event unchanged | Updated | Unchanged |
| Event modified | Updated | Updated |
| Event no longer scraped | Old timestamp | Unchanged |

This makes it possible to detect stale events that are no longer available from the external source.


## Running the Scraper

Run the scraper manually:

```bash
python main.py
```

Example output:

```
Currently scraping page 1
Currently scraping page 2

Found 50 events

Database updated
```


## Execution Flow

The scraper starts from `main.py`.

The execution flow is:

1. Start scraper.
2. Fetch events from external source.
3. Parse event information.
4. Connect to database.
5. Insert new events.
6. Update existing events.
7. Close database connection.


Example:

```python
events = destinationuppsala.destUppScraper()

db.toDB(events)
```


## Automation

The scraper is designed to run automatically, for example once per day.

## Adding New Scrapers

Additional external sources should be implemented as separate scraper modules.

Example:

```
scraper/

├── destinationuppsala.py
├── universityevents.py
├── nationevents.py
├── db.py
└── main.py
```


## Development

Activate the virtual environment:

Windows:

```bash
venv\Scripts\activate
```

Run scraper:

```bash
python main.py
```

Install a new dependency:

```bash
pip install package-name
```

Update requirements:

```bash
pip freeze > requirements.txt
```


## Deployment

The scraper can be deployed separately from the main application.

Example production setup:

```
Server

├── StudentV Backend
|
├── StudentV Frontend
|
├── MySQL Database
|
└── External Events Scraper
        |
        └── Scheduled execution
```

The scraper only requires:

- Python runtime
- Installed dependencies
- Database access
- Environment variables

## Future Improvements

Possible improvements:

- Add more event sources.
- Add automatic removal/archive of expired events.
- Add logging instead of console output.
- Add retry handling for failed requests.
- Add monitoring for scraper failures.
