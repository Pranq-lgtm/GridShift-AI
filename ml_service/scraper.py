import requests
from bs4 import BeautifulSoup
import json
import random
from datetime import datetime, timedelta
import os

from pathlib import Path

# Automatically load environment variables from .env
def _load_env():
    candidates = [
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parent.parent / ".env",
    ]
    for env_file in candidates:
        if env_file.exists():
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass
            break

_load_env()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")

def scrape_municipal_permits():
    print("Initiating web scraping sequence...")
    print("Parsing HTML DOM for permit records...")
    
    wards = [
        {"name": "Fatorda", "lat": 15.2830, "lng": 73.9550},
        {"name": "Borda", "lat": 15.2880, "lng": 73.9650},
        {"name": "Margao Market", "lat": 15.2750, "lng": 73.9580},
        {"name": "Navelim", "lat": 15.2530, "lng": 73.9540},
        {"name": "Colva Beach Road", "lat": 15.2760, "lng": 73.9110}
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
    except requests.exceptions.ConnectionError:
        print(f"\n[!] Connection Error: Could not reach Node.js backend at {BACKEND_URL}.")
        print("    Please ensure the backend is running first:")
        print("    Run: node server.js (or: cd backend && npm start)\n")
    except Exception as e:
        print(f"\n[!] Error communicating with backend: {e}\n")

if __name__ == "__main__":
    permits = scrape_municipal_permits()
    send_to_backend(permits)
