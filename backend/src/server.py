from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlparse
from urllib.request import urlopen
import hashlib
import json
import os
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone


BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "macroarena.sqlite"


def now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def normalize_email(email):
    return str(email or "").strip().lower()


def ensure_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                email TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (email) REFERENCES users(email)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS calculations (
                email TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (email) REFERENCES users(email)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS progress (
                email TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (email) REFERENCES users(email)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS nutrition (
                email TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (email) REFERENCES users(email)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS weather_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                response TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        db.commit()


def connect_db():
    ensure_db()
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        str(password).encode("utf-8"),
        salt.encode("utf-8"),
        120000,
    ).hex()
    return f"{salt}:{password_hash}"


def verify_password(password, stored_hash):
    parts = str(stored_hash or "").split(":")
    if len(parts) != 2:
        return False

    return hash_password(password, parts[0]) == stored_hash


def row_to_user(row):
    if not row:
        return None

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "createdAt": row["created_at"],
    }


def get_user_by_email(db, email):
    return db.execute(
        "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?",
        (normalize_email(email),),
    ).fetchone()


def get_profile(db, email):
    row = db.execute("SELECT data FROM profiles WHERE email = ?", (normalize_email(email),)).fetchone()
    return json.loads(row["data"]) if row else {}


def save_profile_row(db, email, profile):
    profile = dict(profile or {})
    profile["updatedAt"] = now_iso()
    db.execute(
        """
        INSERT INTO profiles (email, data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
        """,
        (normalize_email(email), json.dumps(profile, ensure_ascii=False), profile["updatedAt"]),
    )
    return profile


def get_json_table_value(db, table, email, fallback):
    row = db.execute(f"SELECT data FROM {table} WHERE email = ?", (normalize_email(email),)).fetchone()
    return json.loads(row["data"]) if row else fallback


def table_counts(db):
    tables = ["users", "profiles", "calculations", "progress", "nutrition", "weather_requests"]
    return {
        table: db.execute(f"SELECT COUNT(*) AS count FROM {table}").fetchone()["count"]
        for table in tables
    }


def weather_advice(temperature, wind_speed, rain):
    if rain > 1:
        return "Есть осадки. Для уличной тренировки лучше выбрать зал или снизить интенсивность."
    if wind_speed > 12:
        return "Сильный ветер. Лучше избегать длительного бега на открытых участках."
    if temperature < -5:
        return "Очень холодно. Нужна хорошая разминка и короткие интервалы."
    if temperature > 30:
        return "Жарко. Пейте больше воды и тренируйтесь утром или вечером."
    return "Погода подходит для обычной тренировки."


def fetch_json(url):
    with urlopen(url, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def get_weather(city):
    encoded_city = quote(city)
    geo = fetch_json(
        f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_city}&count=1&language=ru&format=json"
    )
    place = (geo.get("results") or [None])[0]

    if not place:
        return 404, {"message": "Город не найден."}

    weather = fetch_json(
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={place['latitude']}&longitude={place['longitude']}"
        "&current=temperature_2m,wind_speed_10m,rain&timezone=auto"
    )
    current = weather.get("current") or {}
    temperature = round(current.get("temperature_2m") or 0)
    wind_speed = round(current.get("wind_speed_10m") or 0)
    rain = current.get("rain") or 0
    payload = {
        "city": place.get("name"),
        "country": place.get("country") or "",
        "temperature": temperature,
        "windSpeed": wind_speed,
        "rain": rain,
        "updatedAt": now_iso(),
        "advice": weather_advice(temperature, wind_speed, rain),
    }

    with connect_db() as db:
        db.execute(
            "INSERT INTO weather_requests (city, response, created_at) VALUES (?, ?, ?)",
            (city, json.dumps(payload, ensure_ascii=False), now_iso()),
        )
        db.commit()

    return 200, payload


class ApiHandler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(raw)

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        try:
            self.handle_get()
        except Exception as error:
            self.send_json(500, {"message": str(error)})

    def do_POST(self):
        try:
            self.handle_post()
        except Exception as error:
            self.send_json(500, {"message": str(error)})

    def do_PUT(self):
        try:
            self.handle_put()
        except Exception as error:
            self.send_json(500, {"message": str(error)})

    def handle_get(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            with connect_db() as db:
                self.send_json(200, {
                    "ok": True,
                    "service": "MacroArena API",
                    "database": "SQLite",
                    "dbFile": str(DB_PATH),
                    "tables": table_counts(db),
                })
            return

        if path == "/api/sql/stats":
            with connect_db() as db:
                self.send_json(200, {
                    "database": "SQLite",
                    "tables": table_counts(db),
                })
            return

        parts = [unquote(part) for part in path.split("/") if part]
        if len(parts) == 4 and parts[:2] == ["api", "users"] and parts[3] == "profile":
            email = normalize_email(parts[2])
            with connect_db() as db:
                user = get_user_by_email(db, email)
                if not user:
                    self.send_json(404, {"message": "Пользователь не найден."})
                    return
                self.send_json(200, {"user": row_to_user(user), "profile": get_profile(db, email)})
            return

        if len(parts) == 4 and parts[:2] == ["api", "users"] and parts[3] == "data":
            email = normalize_email(parts[2])
            with connect_db() as db:
                user = get_user_by_email(db, email)
                if not user:
                    self.send_json(404, {"message": "Пользователь не найден."})
                    return
                self.send_json(200, {
                    "user": row_to_user(user),
                    "profile": get_profile(db, email),
                    "calculations": get_json_table_value(db, "calculations", email, None),
                    "progress": get_json_table_value(db, "progress", email, []),
                    "nutrition": get_json_table_value(db, "nutrition", email, []),
                })
            return

        self.send_json(404, {"message": "API endpoint не найден."})

    def handle_post(self):
        path = urlparse(self.path).path
        body = self.read_json()

        if path == "/api/auth/register":
            name = str(body.get("name") or "").strip()
            email = normalize_email(body.get("email"))
            password = str(body.get("password") or "")

            if not name or not email or len(password) < 4:
                self.send_json(400, {"message": "Имя, email и пароль от 4 символов обязательны."})
                return

            with connect_db() as db:
                if get_user_by_email(db, email):
                    self.send_json(409, {"message": "Такой email уже зарегистрирован."})
                    return

                user_id = str(uuid.uuid4())
                created_at = now_iso()
                db.execute(
                    "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                    (user_id, name, email, hash_password(password), created_at),
                )
                profile = save_profile_row(db, email, {"fullName": body.get("profile", {}).get("fullName") or name})
                db.commit()
                user = get_user_by_email(db, email)
                self.send_json(201, {"user": row_to_user(user), "profile": profile})
            return

        if path == "/api/auth/login":
            email = normalize_email(body.get("email"))
            with connect_db() as db:
                user = get_user_by_email(db, email)
                if not user or not verify_password(body.get("password"), user["password_hash"]):
                    self.send_json(401, {"message": "Email или пароль неправильный."})
                    return
                self.send_json(200, {"user": row_to_user(user), "profile": get_profile(db, email)})
            return

        if path == "/api/weather":
            city = str(body.get("city") or "").strip()
            if not city:
                self.send_json(400, {"message": "Город обязателен."})
                return
            status, payload = get_weather(city)
            self.send_json(status, payload)
            return

        self.send_json(404, {"message": "API endpoint не найден."})

    def handle_put(self):
        path = urlparse(self.path).path
        parts = [unquote(part) for part in path.split("/") if part]
        body = self.read_json()

        if len(parts) == 4 and parts[:2] == ["api", "users"] and parts[3] == "profile":
            email = normalize_email(parts[2])
            with connect_db() as db:
                user = get_user_by_email(db, email)
                if not user:
                    self.send_json(404, {"message": "Пользователь не найден."})
                    return
                profile = save_profile_row(db, email, body.get("profile") or body)
                db.commit()
                self.send_json(200, {"user": row_to_user(user), "profile": profile})
            return

        self.send_json(404, {"message": "API endpoint не найден."})


def main():
    ensure_db()
    port = int(os.environ.get("PORT", "3000"))
    server = HTTPServer(("127.0.0.1", port), ApiHandler)
    print(f"MacroArena API with SQLite is running on http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
