# 🌦️ AI Weather Assistant

A modern web application demonstrating **LLM Function Calling** with the Gemini API and OpenWeather API. Users can ask weather questions in natural language, and the AI decides which backend function to call.

---

## 🚀 Tech Stack

| Layer    | Technology                             |
|----------|----------------------------------------|
| Frontend | HTML5, CSS3, Tailwind CSS, Vanilla JS  |
| Backend  | Python, Flask, Flask-CORS              |
| LLM      | Google Gemini 1.5 Flash (Function Calling) |
| Weather  | OpenWeather API                        |

---

## 📁 Project Structure

```
ai-weather-assistant/
├── frontend/
│   ├── index.html     # Main UI (glassmorphism, dark/light mode)
│   ├── style.css      # Custom CSS — deep-space aesthetic
│   └── script.js      # Chat logic, API calls, weather card rendering
│
└── backend/
    ├── app.py             # Flask app + Gemini function calling
    ├── weather_service.py # OpenWeather API wrapper
    └── requirements.txt
```

---

## ⚙️ Setup Instructions

### 1. Get API Keys

- **Gemini API Key** → [Google AI Studio](https://aistudio.google.com/app/apikey)
- **OpenWeather API Key** → [openweathermap.org](https://openweathermap.org/api) (free tier works)

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables (Linux/Mac)
export GEMINI_API_KEY="your_gemini_key_here"
export OPENWEATHER_API_KEY="your_openweather_key_here"

# Windows PowerShell
# $env:GEMINI_API_KEY="your_gemini_key_here"
# $env:OPENWEATHER_API_KEY="your_openweather_key_here"

# Start server
python app.py
```

The Flask server will start at `http://127.0.0.1:5000`

### 3. Frontend Setup

Simply open `frontend/index.html` in your browser — no build step needed!

Or serve it with Python:
```bash
cd frontend
python -m http.server 3000
# Open http://localhost:3000
```

---

## 🔑 How Function Calling Works

```
User types: "What's the weather in Tokyo?"
        │
        ▼
  Flask receives POST /chat
        │
        ▼
  Gemini analyzes the message
  → Decides to call: get_current_weather(city="Tokyo", units="metric")
        │
        ▼
  Flask calls weather_service.py
  → Hits OpenWeather API
  → Returns structured JSON
        │
        ▼
  Result sent back to Gemini
  → Gemini generates natural language response
        │
        ▼
  Frontend renders AI message + weather card
```

---

## 💬 Example Questions

- "What's the weather in Bangalore?"
- "Is it raining in London today?"
- "Show me a 5-day forecast for New York"
- "Do I need an umbrella in Tokyo?"
- "Compare the weather in Paris and Berlin"
- "What's the temperature in degrees Fahrenheit in Miami?"

---

## 🎨 Features

- ✅ Dark / Light mode toggle
- ✅ Glassmorphism UI with animated background orbs
- ✅ Typing indicator animation
- ✅ Weather emoji auto-mapping from conditions
- ✅ Rich weather cards (temp, humidity, wind, min/max)
- ✅ Quick chip shortcuts for popular cities
- ✅ Responsive — mobile, tablet, desktop
- ✅ Graceful fallback to demo mode when backend is offline
- ✅ Gemini function calling with multi-turn conversation

---

## 🌐 API Endpoints

| Method | Endpoint  | Description              |
|--------|-----------|--------------------------|
| POST   | `/chat`   | Send a message, get AI + weather response |
| GET    | `/health` | Check server status      |

### POST `/chat` Request
```json
{ "message": "What's the weather in London?" }
```

### POST `/chat` Response
```json
{
  "reply": "☁️ London is currently cloudy at 14°C...",
  "weather": {
    "city": "London",
    "country": "GB",
    "temp": 14.2,
    "feels_like": 12.1,
    "humidity": 81,
    "wind_speed": 5.1,
    "condition": "Clouds",
    "description": "overcast clouds",
    "temp_min": 11.0,
    "temp_max": 16.5
  }
}
```

---

## 📝 License

MIT — free to use for portfolio, internship demos, and projects.
