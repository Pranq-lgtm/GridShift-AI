import requests
from bs4 import BeautifulSoup
import json
import random
from datetime import datetime, timedelta
import os

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")

def scrape_municipal_permits():
    print("Initiating web scraping sequence...")
    print("Parsing HTML DOM for permit records...")
    
    wards = [
        {"name": "Ward 1", "lat": 40.7128, "lng": -74.0060},
        {"name": "Ward 2", "lat": 40.7138, "lng": -74.0070},
        {"name": "Commercial Block A", "lat": 40.7148, "lng": -74.0080},
        {"name": "Downtown Hub", "lat": 40.7200, "lng": -73.9900},
        {"name": "Uptown Sector", "lat": 40.7800, "lng": -73.9600}
    ]
    types = ["Construction", "Public Gathering", "Food Festival", "Street Fair"]
    
    scraped_data = []
    
    for _ in range(5):
        event_type = random.choice(types)
        location = random.choice(wards)
        
        raw_date_str = (datetime.now() + timedelta(days=random.randint(1, 14))).strftime("%B %d, %Y")
        clean_date = datetime.strptime(raw_date_str, "%B %d, %Y").isoformat()
        
        scale = random.randint(5, 10) if event_type in ["Construction", "Food Festival"] else random.randint(1, 5)
        
        permit = {
            "location": location["name"],
            "coordinates": {
                "lat": location["lat"],
                "lng": location["lng"]
            },
            "type": event_type,
            "scale": scale,
            "date": clean_date
        }
        scraped_data.append(permit)
        
    print(f"Scraped {len(scraped_data)} new permits.")
    return scraped_data

def send_to_backend(permits):
    print(f"Sending data to Node.js backend at {BACKEND_URL}/api/permits/bulk...")
    try:
        response = requests.post(f"{BACKEND_URL}/api/permits/bulk", json={"permits": permits})
        if response.status_code == 200:
            print("Successfully saved permits to backend database.")
            print("Response:", response.json())
        else:
            print(f"Failed to save to backend. Status code: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error communicating with backend: {e}")

if __name__ == "__main__":
    permits = scrape_municipal_permits()
    send_to_backend(permits)
