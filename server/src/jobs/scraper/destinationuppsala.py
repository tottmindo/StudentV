import requests
from bs4 import BeautifulSoup

def destUppScraper():
    events = []
    page = 1

    while True:
        URL = f"https://destinationuppsala.se/event/page/{page}"
        print(f"Currently scraping page {page}")
        response = requests.get(URL, timeout=10)

        soup = BeautifulSoup(response.content, "html.parser")

        results = soup.find(id="mainContent")
        if not results:
            break

        foundEvents = False

        for event in results.select("div.o-grid__item"):
            textArea = event.select_one("a.c-ui-link--delta-brand")
            dateArea = event.select_one("a.c-img-module")

            if textArea:
                title = textArea.get_text(strip=True)
                url = textArea["href"]

                foundEvents = True
                start_date = None
                end_date = None

                if dateArea:
                    date_raw = dateArea.get_text(" ", strip=True)
                    
                    # If there's a dash, split into start and end
                    if "-" in date_raw:
                        parts = date_raw.split("-")
                        start_date = parts[0].strip()
                        end_date = parts[1].strip()
                    else:
                        # Single-day event
                        start_date = date_raw.strip()
                        end_date = start_date

                events.append({
                    "title": title,
                    "url": url,
                    "startDate": start_date,
                    "endDate": end_date
                })

        page += 1

        if not foundEvents:
            break

    return events

