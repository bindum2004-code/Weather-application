# app.py — Flask backend with Groq + Llama Function Calling
# -------------------------------------------------------
# FREE API — Get key at https://console.groq.com (no credit card)
# -------------------------------------------------------

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from groq import Groq

from weather_service import get_current_weather, get_forecast

# ── Configuration ──────────────────────────────────────
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

# ── PASTE YOUR KEYS HERE ───────────────────────────────
import os
from dotenv import load_dotenv
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")    # ← from openweathermap.org

client = Groq(api_key=GROQ_API_KEY)

# ── Serve Frontend ─────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

# ── Tool Definitions (OpenAI-compatible format) ────────
weather_tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": (
                "Get the current weather for a specific city. "
                "Use this when the user asks about current weather, "
                "temperature, humidity, wind, or general weather in a city."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city name, e.g. 'London' or 'New York'",
                    },
                    "units": {
                        "type": "string",
                        "enum": ["metric", "imperial"],
                        "description": "metric = Celsius, imperial = Fahrenheit. Default metric.",
                    },
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather_forecast",
            "description": (
                "Get a multi-day weather forecast for a city. "
                "Use this for future weather, tomorrow, or upcoming days."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city name",
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of forecast days (1-5). Default 3.",
                    },
                    "units": {
                        "type": "string",
                        "enum": ["metric", "imperial"],
                        "description": "Temperature units. Default metric.",
                    },
                },
                "required": ["city"],
            },
        },
    },
]

# ── Function dispatcher ────────────────────────────────
def dispatch_function(name: str, args: dict) -> dict:
    if name == "get_current_weather":
        return get_current_weather(
            city=args.get("city", ""),
            units=args.get("units", "metric")
        )
    elif name == "get_weather_forecast":
        return get_forecast(
            city=args.get("city", ""),
            days=int(args.get("days", 3)),
            units=args.get("units", "metric")
        )
    return {"error": f"Unknown function: {name}"}

# ── System Prompt ──────────────────────────────────────
SYSTEM_PROMPT = """You are a friendly AI weather assistant.
Help users understand weather conditions around the world.

- Always use the provided tools to fetch real weather data.
- Be conversational and add helpful tips (e.g. "Bring an umbrella!" for rain).
- If no city is mentioned, ask the user to specify one.
- Use get_current_weather for current conditions.
- Use get_weather_forecast for future/upcoming weather.
- Keep responses concise and friendly.
- Add a weather emoji to make responses lively."""

# ── Main Chat Endpoint ─────────────────────────────────
@app.route("/chat", methods=["POST"])
def chat():
    body = request.get_json(silent=True)
    if not body or "message" not in body:
        return jsonify({"error": "Missing 'message' field"}), 400

    user_message = body["message"].strip()
    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ]
        weather_result  = None
        forecast_result = None

        # ── Agentic loop ───────────────────────────────
        for _ in range(5):  # max 5 rounds
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=weather_tools,
                tool_choice="auto",
                max_tokens=1024,
            )

            msg = response.choices[0].message
            messages.append(msg)

            # No tool calls → final answer ready
            if not msg.tool_calls:
                break

            # Process each tool call
            for tool_call in msg.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)

                result = dispatch_function(fn_name, fn_args)

                # Store for weather card in frontend
                if fn_name == "get_current_weather" and "error" not in result:
                    weather_result = result
                elif fn_name == "get_weather_forecast" and "error" not in result:
                    forecast_result = result

                # Feed result back into conversation
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })

        # ── Extract reply ──────────────────────────────
        reply_text = response.choices[0].message.content or "I couldn't generate a response. Please try again."

        payload = {"reply": reply_text}
        if weather_result:
            payload["weather"] = weather_result
        if forecast_result:
            payload["forecast"] = forecast_result

        return jsonify(payload)

    except Exception as e:
        app.logger.error(f"Chat error: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


# ── Direct Weather Endpoint (for Dashboard & Forecast pages) ──
@app.route("/weather", methods=["GET"])
def weather_direct():
    city = request.args.get("city", "").strip()
    if not city:
        return jsonify({"error": "Missing city parameter"}), 400
    result = get_current_weather(city)
    return jsonify(result)

@app.route("/forecast", methods=["GET"])
def forecast_direct():
    city = request.args.get("city", "").strip()
    days = int(request.args.get("days", 5))
    if not city:
        return jsonify({"error": "Missing city parameter"}), 400
    result = get_forecast(city, days)
    return jsonify(result)

# ── Health Check ───────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "llama-3.3-70b-versatile (Groq)"})


# ── Run ────────────────────────────────────────────────
if __name__ == '__main__':
    from waitress import serve
    serve(app, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
