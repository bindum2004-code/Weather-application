# weather_service.py — OpenWeather API integration

import os
import requests
from dotenv import load_dotenv
load_dotenv()
API_KEY = os.environ.get("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"


def get_current_weather(city: str, units: str = "metric") -> dict:
    """
    Fetch current weather for a given city using OpenWeather API.

    Args:
        city:  City name (e.g., "London" or "London,UK")
        units: "metric" (°C) | "imperial" (°F) | "standard" (K)

    Returns:
        dict with weather data, or dict with "error" key on failure.
    """
    try:
        params = {
            "q": city,
            "appid": OPENWEATHER_API_KEY,
            "units": units,
        }
        response = requests.get(f"{BASE_URL}/weather", params=params, timeout=10)
        response.raise_for_status()
        raw = response.json()

        return {
            "city":        raw["name"],
            "country":     raw["sys"]["country"],
            "temp":        round(raw["main"]["temp"], 1),
            "feels_like":  round(raw["main"]["feels_like"], 1),
            "temp_min":    round(raw["main"]["temp_min"], 1),
            "temp_max":    round(raw["main"]["temp_max"], 1),
            "humidity":    raw["main"]["humidity"],
            "wind_speed":  raw["wind"]["speed"],
            "condition":   raw["weather"][0]["main"],
            "description": raw["weather"][0]["description"],
            "icon":        raw["weather"][0]["icon"],
            "visibility":  raw.get("visibility", 0) // 1000,  # km
            "pressure":    raw["main"]["pressure"],
            "units":       units,
        }

    except requests.exceptions.HTTPError as e:
        code = e.response.status_code if e.response else 0
        if code == 404:
            return {"error": f"City '{city}' not found. Please check the spelling."}
        if code == 401:
            return {"error": "Invalid OpenWeather API key."}
        return {"error": f"Weather API error: {e}"}
    except requests.exceptions.ConnectionError:
        return {"error": "Cannot connect to OpenWeather API. Check your internet connection."}
    except requests.exceptions.Timeout:
        return {"error": "OpenWeather API request timed out."}
    except Exception as e:
        return {"error": f"Unexpected error: {e}"}


def get_forecast(city: str, days: int = 3, units: str = "metric") -> dict:
    """
    Fetch 3-hour-step forecast (up to 5 days) for a city.

    Args:
        city:  City name
        days:  Number of days of forecast (1–5)
        units: unit system

    Returns:
        dict with daily summary list, or dict with "error" key.
    """
    try:
        params = {
            "q": city,
            "appid": OPENWEATHER_API_KEY,
            "units": units,
            "cnt": min(days * 8, 40),  # 8 readings per day
        }
        response = requests.get(f"{BASE_URL}/forecast", params=params, timeout=10)
        response.raise_for_status()
        raw = response.json()

        # Summarise by day
        from collections import defaultdict
        days_map = defaultdict(list)
        for item in raw["list"]:
            day = item["dt_txt"].split(" ")[0]
            days_map[day].append(item)

        daily = []
        for date, entries in list(days_map.items())[:days]:
            temps = [e["main"]["temp"] for e in entries]
            desc  = entries[len(entries) // 2]["weather"][0]["description"]
            daily.append({
                "date":    date,
                "temp_min": round(min(temps), 1),
                "temp_max": round(max(temps), 1),
                "description": desc,
            })

        return {
            "city":    raw["city"]["name"],
            "country": raw["city"]["country"],
            "forecast": daily,
            "units":   units,
        }

    except requests.exceptions.HTTPError as e:
        code = e.response.status_code if e.response else 0
        if code == 404:
            return {"error": f"City '{city}' not found."}
        return {"error": f"Forecast API error: {e}"}
    except Exception as e:
        return {"error": f"Unexpected error fetching forecast: {e}"}