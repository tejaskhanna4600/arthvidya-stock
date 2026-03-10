"""
Arthvidya Stock Exchange - Flask backend for local event.
Real-time sync via SocketIO. In-memory session store.
Backup/restore: export snapshot JSON, restore from file; optional auto-save to disk.
Admin undo: simple single-step undo for stock price & news changes.
"""
import copy
import json
import os
import random
from collections import defaultdict
from datetime import datetime, timezone
from threading import Lock, Thread

from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE", "0") == "1"
# Backup: directory for auto-saves; set RESTORE_FROM_BACKUP to path to restore on startup
BACKUP_DIR = os.environ.get("BACKUP_DIR", os.path.join(BASE_DIR, "backups"))
AUTO_BACKUP_INTERVAL_SEC = int(os.environ.get("AUTO_BACKUP_INTERVAL_SEC", "300"))  # 5 min default; 0 = disabled

# CORS: use env CORS_ORIGINS for LAN
_cors_origins_env = os.environ.get("CORS_ORIGINS", "").strip()
CORS_ORIGINS_LIST = (
    [o.strip() for o in _cors_origins_env.split(",") if o.strip()]
    if _cors_origins_env
    else [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]
)
CORS(app, supports_credentials=True, origins=CORS_ORIGINS_LIST)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ----- In-memory store -----
lock = Lock()
stocks = {}  # name -> { name, price, priceHistory: list, industry: str }
teams = {}   # name -> { name, cash, portfolio: { stockName: qty }, shortPositions, totalValue, password: str }
news_list = {}  # id -> { headline, description, isFlashed }
news_id_counter = 0
# roundDurationMinutes: admin-set timer length; roundEndAt: Unix timestamp when round timer ends (set on start, cleared on end)
market_state = {"roundNumber": 0, "isOpen": False, "breakMode": False, "roundDurationMinutes": 5, "roundEndAt": None}
user_profiles = {}  # session_id or "admin"|"screen"|team_name -> { name, teamName? }
# Single-step undo snapshot for admin operations on stocks/news
last_admin_snapshot = None

# Default credentials (spec)
ADMIN_CREDENTIALS = {"id": "Tejas10", "password": "4600"}
SCREEN_CREDENTIALS = {"id": "Tejas10", "password": "4600"}
# Team login: any created team name + password "Team1" for simplicity, or store team passwords

CHAOS_CARDS = [
    "Market Crash: All stocks drop 20%",
    "Bull Run: All stocks rise 30%",
    "Insider Trading: One team gets bonus info",
    "Regulatory Freeze: Trading halted for 1 round",
    "Stock Split: Double shares, half price",
    "Merger Mania: Two random stocks merge",
    "Tax Audit: Top team loses 15% cash",
    "Stimulus Package: All teams get ₹2000",
    "Flash Crash: Random stock drops 50%",
    "IPO Boom: New stock enters market",
]


def _update_team_total_value(team_name):
    team = teams.get(team_name)
    if not team:
        return
    total = team["cash"]
    for sn, qty in team["portfolio"].items():
        if sn in stocks:
            total += stocks[sn]["price"] * qty
    # Short positions are a liability: must buy back at current price
    for sn, qty in team.get("shortPositions", {}).items():
        if sn in stocks:
            total -= stocks[sn]["price"] * qty
    team["totalValue"] = total


def _save_admin_snapshot():
    """Capture current stocks + news for a simple one-step admin undo."""
    global last_admin_snapshot
    last_admin_snapshot = {
        "stocks": copy.deepcopy(stocks),
        "news_list": copy.deepcopy(news_list),
        "news_id_counter": news_id_counter,
    }


def _require_admin():
    role = session.get("role")
    if role != "admin":
        return jsonify({"error": "Unauthorized: Admin only"}), 403
    return None


def _require_user():
    role = session.get("role")
    if role not in ("admin", "team", "screen"):
        return jsonify({"error": "Unauthorized"}), 403
    return None


def _require_team_or_admin():
    role = session.get("role")
    if role not in ("admin", "team"):
        return jsonify({"error": "Unauthorized"}), 403
    return None


def _caller_team_name():
    if session.get("role") == "admin":
        return None  # admin can act for any team via param
    return session.get("team_name")


# ----- Backup / Restore -----
def _build_snapshot():
    """Build a JSON-serializable snapshot of current state (call under lock or copy)."""
    global last_chaos_card
    return {
        "version": 1,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "stocks": {k: {"name": v["name"], "price": v["price"], "priceHistory": list(v["priceHistory"]), "industry": v.get("industry", "")} for k, v in stocks.items()},
        "teams": {k: {"name": t["name"], "cash": t["cash"], "portfolio": dict(t["portfolio"]), "shortPositions": dict(t.get("shortPositions", {})), "totalValue": t["totalValue"], "password": t.get("password", k)} for k, t in teams.items()},
        "news": {str(nid): {"headline": n["headline"], "description": n["description"], "isFlashed": n["isFlashed"]} for nid, n in news_list.items()},
        "newsIdCounter": news_id_counter,
        "marketState": {"roundNumber": market_state["roundNumber"], "isOpen": market_state["isOpen"], "breakMode": market_state.get("breakMode", False), "roundDurationMinutes": market_state.get("roundDurationMinutes", 5), "roundEndAt": market_state.get("roundEndAt")},
        "lastChaosCard": last_chaos_card,
    }


def _apply_snapshot(data):
    """Replace in-memory state with snapshot. Caller must hold lock."""
    global stocks, teams, news_list, news_id_counter, market_state, last_chaos_card
    stocks.clear()
    for k, v in data.get("stocks", {}).items():
        stocks[k] = {"name": v["name"], "price": v["price"], "priceHistory": list(v.get("priceHistory", [v["price"]])), "industry": v.get("industry", "")}
    teams.clear()
    for k, t in data.get("teams", {}).items():
        portfolio = t.get("portfolio", {})
        if isinstance(portfolio, list):
            portfolio = dict(portfolio)
        shorts = t.get("shortPositions", {})
        if isinstance(shorts, list):
            shorts = dict(shorts)
        teams[k] = {"name": t["name"], "cash": t["cash"], "portfolio": portfolio, "shortPositions": shorts, "totalValue": t.get("totalValue", t["cash"]), "password": t.get("password", k)}
        _update_team_total_value(k)
    news_list.clear()
    for nid_str, n in data.get("news", {}).items():
        news_list[int(nid_str)] = {"headline": n["headline"], "description": n["description"], "isFlashed": n.get("isFlashed", False)}
    news_id_counter = data.get("newsIdCounter", 0)
    ms = data.get("marketState", {})
    market_state["roundNumber"] = ms.get("roundNumber", 0)
    market_state["isOpen"] = ms.get("isOpen", False)
    market_state["breakMode"] = ms.get("breakMode", False)
    market_state["roundDurationMinutes"] = ms.get("roundDurationMinutes", 5)
    market_state["roundEndAt"] = ms.get("roundEndAt")
    last_chaos_card = data.get("lastChaosCard")


# ----- Auth -----
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    panel_type = data.get("panelType")  # "admin" | "screen" | "team"
    user_id = data.get("id", "").strip()
    password = data.get("password", "")
    team_name = data.get("teamName", "").strip()  # for team panel

    if panel_type == "admin":
        if user_id != ADMIN_CREDENTIALS["id"] or password != ADMIN_CREDENTIALS["password"]:
            return jsonify({"error": "Invalid credentials"}), 401
        session["role"] = "admin"
        session["team_name"] = None
        return jsonify({"ok": True, "role": "admin"})

    if panel_type == "screen":
        if user_id != SCREEN_CREDENTIALS["id"] or password != SCREEN_CREDENTIALS["password"]:
            return jsonify({"error": "Invalid credentials"}), 401
        session["role"] = "screen"
        session["team_name"] = None
        return jsonify({"ok": True, "role": "screen"})

    if panel_type == "team":
        # Team: login with team name (must exist) and password "Team1" or the team name (case-insensitive)
        if not team_name:
            team_name = user_id
        team_name = (team_name or "").strip()
        if not team_name:
            return jsonify({"error": "Enter your team name"}), 401
        # Match team by name (case-insensitive) so "team alpha" matches "Team Alpha"
        team_key = None
        for k in teams:
            if k.strip().lower() == team_name.lower():
                team_key = k
                break
        if team_key is None:
            return jsonify({"error": "Team not found. Admin must create your team first (Admin → Teams)."}), 401
        password = (password or "").strip()
        stored_pw = teams[team_key].get("password")
        if stored_pw:
            pw_ok = password == stored_pw
        else:
            pw_ok = password.lower() == "team1" or password.lower() == team_key.lower()
        if not pw_ok:
            return jsonify({"error": "Invalid password. Ask your admin for the team password."}), 401
        session["role"] = "team"
        session["team_name"] = team_key  # use actual key from teams dict
        return jsonify({"ok": True, "role": "team", "teamName": team_key})

    return jsonify({"error": "Invalid panel type"}), 400


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/me", methods=["GET"])
def me():
    role = session.get("role")
    if not role:
        return jsonify({"user": None})
    return jsonify({
        "user": {
            "role": role,
            "teamName": session.get("team_name"),
        }
    })


# ----- Profile (for team: name + team association; admin/screen can have name only) -----
@app.route("/api/profile", methods=["GET"])
def get_profile():
    err = _require_user()
    if err:
        return err
    role = session.get("role")
    team_name = session.get("team_name")
    key = "admin" if role == "admin" else ("screen" if role == "screen" else team_name)
    profile = user_profiles.get(key)
    if not profile:
        return jsonify({"profile": None})
    return jsonify({"profile": profile})


@app.route("/api/profile", methods=["POST"])
def save_profile():
    err = _require_user()
    if err:
        return err
    data = request.get_json() or {}
    name = data.get("name", "")
    team_name_param = data.get("teamName")
    role = session.get("role")
    team_name = session.get("team_name")
    if role == "team" and team_name_param and team_name_param != team_name:
        if team_name_param not in teams:
            return jsonify({"error": "Team not found"}), 400
        team_name = team_name_param
        session["team_name"] = team_name
    key = "admin" if role == "admin" else ("screen" if role == "screen" else team_name)
    user_profiles[key] = {"name": name, "teamName": team_name if role == "team" else None}
    return jsonify({"ok": True})


# ----- Stocks -----
@app.route("/api/stocks", methods=["GET"])
def get_all_stocks():
    err = _require_user()
    if err:
        return err
    with lock:
        out = [[name, {"name": s["name"], "price": s["price"], "priceHistory": s["priceHistory"][:], "industry": s.get("industry", "")}] for name, s in stocks.items()]
    return jsonify(out)


@app.route("/api/stocks", methods=["POST"])
def create_stock():
    err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    initial_price = float(data.get("initialPrice", 3000))
    industry = (data.get("industry") or "").strip()
    if not name:
        return jsonify({"error": "Stock name required"}), 400
    if initial_price <= 0:
        return jsonify({"error": "Initial price must be positive"}), 400
    with lock:
        if name in stocks:
            return jsonify({"error": "Stock already exists"}), 400
        stocks[name] = {"name": name, "price": initial_price, "priceHistory": [initial_price], "industry": industry}
    socketio.emit("stocks_updated")
    return jsonify({"ok": True})


@app.route("/api/stocks/batch-price", methods=["POST"])
def batch_update_stock_price():
    """Admin: batch update multiple stock prices in one go.

    Body: { "updates": [ { "name": str, "newPrice": float }, ... ] }
    """
    err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    updates = data.get("updates") or []
    if not isinstance(updates, list) or not updates:
        return jsonify({"error": "No updates provided"}), 400

    # Validate first
    parsed = []
    for u in updates:
        name = (u.get("name") or "").strip()
        try:
            price = float(u.get("newPrice", 0))
        except Exception:
            return jsonify({"error": f"Invalid price for {name or 'unknown stock'}"}), 400
        if not name or price <= 0:
            return jsonify({"error": f"Invalid update for {name or 'unknown stock'}"}), 400
        parsed.append((name, price))

    with lock:
        # Ensure all stocks exist before changing anything
        for name, _price in parsed:
            if name not in stocks:
                return jsonify({"error": f"Stock not found: {name}"}), 404

        # Snapshot for undo, then apply
        _save_admin_snapshot()
        for name, price in parsed:
            stocks[name]["price"] = price
            stocks[name]["priceHistory"].append(price)

        for t in teams.values():
            _update_team_total_value(t["name"])

    socketio.emit("stocks_updated")
    socketio.emit("teams_updated")
    return jsonify({"ok": True, "updated": len(parsed)})


@app.route("/api/stocks/<name>/price", methods=["PUT"])
def update_stock_price(name):
    err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    new_price = float(data.get("newPrice", 0))
    if new_price <= 0:
        return jsonify({"error": "Invalid price"}), 400
    with lock:
        if name not in stocks:
            return jsonify({"error": "Stock not found"}), 404
        _save_admin_snapshot()
        stocks[name]["price"] = new_price
        stocks[name]["priceHistory"].append(new_price)
        for t in teams.values():
            _update_team_total_value(t["name"])
    socketio.emit("stocks_updated")
    return jsonify({"ok": True})


@app.route("/api/stocks/<name>", methods=["PUT"])
def update_stock_meta(name):
    """Admin: update stock name and/or industry.

    - newName: optional new stock symbol. Renames across stocks and all team portfolios/shorts.
    - industry: optional new industry label.
    """
    err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    new_name = (data.get("newName") or "").strip()
    new_industry = data.get("industry")

    if not new_name and new_industry is None:
        return jsonify({"error": "No changes provided"}), 400

    with lock:
        if name not in stocks:
            return jsonify({"error": "Stock not found"}), 404
        _save_admin_snapshot()
        stock = stocks[name]
        target_name = new_name or name

        if target_name != name and target_name in stocks:
            return jsonify({"error": "Another stock with that name already exists"}), 400

        # Rename key and update team portfolios/short positions
        if target_name != name:
            stocks[target_name] = stock
            del stocks[name]
            stock = stocks[target_name]
            stock["name"] = target_name
            for t in teams.values():
                if name in t["portfolio"]:
                    t["portfolio"][target_name] = t["portfolio"].pop(name)
                shorts = t.get("shortPositions") or {}
                if name in shorts:
                    shorts[target_name] = shorts.pop(name)

        if new_industry is not None:
            stock["industry"] = (new_industry or "").strip()

    socketio.emit("stocks_updated")
    return jsonify({"ok": True})


# ----- Teams -----
@app.route("/api/teams", methods=["GET"])
def get_all_teams():
    err = _require_admin()
    if err:
        return err
    with lock:
        out = []
        for name, t in teams.items():
            out.append([name, {
                "name": t["name"],
                "cash": t["cash"],
                "portfolio": [[k, v] for k, v in t["portfolio"].items()],
                "shortPositions": [[k, v] for k, v in t.get("shortPositions", {}).items()],
                "totalValue": t["totalValue"],
            }])
    return jsonify(out)


@app.route("/api/teams", methods=["POST"])
def create_team():
    err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    initial_cash = float(data.get("initialCash", 10000))
    password = (data.get("password") or "").strip()
    if not name:
        return jsonify({"error": "Team name required"}), 400
    with lock:
        if name in teams:
            return jsonify({"error": "Team already exists"}), 400
        teams[name] = {
            "name": name,
            "cash": initial_cash,
            "portfolio": {},
            "shortPositions": {},
            "totalValue": initial_cash,
            "password": password if password else name,
        }
    socketio.emit("teams_updated")
    return jsonify({"ok": True})


@app.route("/api/teams/<name>/cash", methods=["PUT"])
def update_team_cash(name):
    err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    amount = float(data.get("amount", 0))
    with lock:
        if name not in teams:
            return jsonify({"error": "Team not found"}), 404
        teams[name]["cash"] += amount
        _update_team_total_value(name)
    socketio.emit("teams_updated")
    return jsonify({"ok": True})


@app.route("/api/teams/<name>", methods=["PUT"])
def update_team(name):
    """Admin: update team name and/or password. newName and password are optional."""
    err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    new_name = (data.get("newName") or "").strip()
    password = (data.get("password") or "").strip()
    if not new_name and password == "" and "password" not in data:
        return jsonify({"error": "Provide newName and/or password to update"}), 400
    with lock:
        if name not in teams:
            return jsonify({"error": "Team not found"}), 404
        team = teams[name]
        target_name = new_name or name
        if target_name != name and target_name in teams:
            return jsonify({"error": "Another team with that name already exists"}), 400
        if target_name != name:
            teams[target_name] = team
            del teams[name]
            team = teams[target_name]
            team["name"] = target_name
            if name in user_profiles:
                user_profiles[target_name] = user_profiles.pop(name)
        if "password" in data:
            team["password"] = password if password else target_name
    socketio.emit("teams_updated")
    return jsonify({"ok": True})


@app.route("/api/teams/<name>", methods=["DELETE"])
def delete_team(name):
    """Admin: delete a team. Removes team and any associated user profile."""
    err = _require_admin()
    if err:
        return err
    with lock:
        if name not in teams:
            return jsonify({"error": "Team not found"}), 404
        del teams[name]
        if name in user_profiles:
            del user_profiles[name]
    socketio.emit("teams_updated")
    return jsonify({"ok": True})


@app.route("/api/team/me", methods=["GET"])
def get_caller_team():
    err = _require_team_or_admin()
    if err:
        return err
    team_name = _caller_team_name() or (request.args.get("teamName") if session.get("role") == "admin" else None)
    if not team_name or team_name not in teams:
        return jsonify(None)
    t = teams[team_name]
    with lock:
        team_view = {
            "name": t["name"],
            "cash": t["cash"],
            "portfolio": [[k, v] for k, v in t["portfolio"].items()],
            "shortPositions": [[k, v] for k, v in t.get("shortPositions", {}).items()],
            "totalValue": t["totalValue"],
        }
    return jsonify(team_view)


# ----- Market state -----
@app.route("/api/market-state", methods=["GET"])
def get_market_state():
    err = _require_user()
    if err:
        return err
    with lock:
        out = {
            "roundNumber": market_state["roundNumber"],
            "isOpen": market_state["isOpen"],
            "breakMode": market_state.get("breakMode", False),
            "roundDurationMinutes": market_state.get("roundDurationMinutes", 5),
            "roundEndAt": market_state.get("roundEndAt"),
        }
    return jsonify(out)


@app.route("/api/round/start", methods=["POST"])
def start_round():
    err = _require_admin()
    if err:
        return err
    with lock:
        if market_state["isOpen"]:
            return jsonify({"error": "Market already open"}), 400
        market_state["roundNumber"] += 1
        market_state["isOpen"] = True
        duration_min = market_state.get("roundDurationMinutes") or 5
        market_state["roundEndAt"] = datetime.now(timezone.utc).timestamp() + duration_min * 60
    socketio.emit("market_state_updated")
    socketio.emit("round_started", {"roundNumber": market_state["roundNumber"]})
    return jsonify({"ok": True})


@app.route("/api/round/end", methods=["POST"])
def end_round():
    err = _require_admin()
    if err:
        return err
    with lock:
        if not market_state["isOpen"]:
            return jsonify({"error": "Market already closed"}), 400
        market_state["isOpen"] = False
        market_state["roundEndAt"] = None
    socketio.emit("market_state_updated")
    return jsonify({"ok": True})


@app.route("/api/round/set-duration", methods=["POST"])
def set_round_duration():
    """Admin: set round timer duration in minutes (used when next round starts)."""
    err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    minutes = data.get("minutes")
    if minutes is None:
        return jsonify({"error": "minutes required"}), 400
    try:
        minutes = int(minutes)
    except (TypeError, ValueError):
        return jsonify({"error": "minutes must be an integer"}), 400
    if minutes < 1 or minutes > 120:
        return jsonify({"error": "minutes must be between 1 and 120"}), 400
    with lock:
        market_state["roundDurationMinutes"] = minutes
    return jsonify({"ok": True, "roundDurationMinutes": minutes})


@app.route("/api/break/start", methods=["POST"])
def break_start():
    """Admin: show break screen on projector (leaderboard + stats)."""
    err = _require_admin()
    if err:
        return err
    with lock:
        market_state["breakMode"] = True
    socketio.emit("market_state_updated")
    socketio.emit("break_started")
    return jsonify({"ok": True})


@app.route("/api/break/end", methods=["POST"])
def break_end():
    """Admin: hide break screen, back to live market."""
    err = _require_admin()
    if err:
        return err
    with lock:
        market_state["breakMode"] = False
    socketio.emit("market_state_updated")
    socketio.emit("break_ended")
    return jsonify({"ok": True})


# ----- News -----
@app.route("/api/news", methods=["GET"])
def get_all_news():
    err = _require_user()
    if err:
        return err
    with lock:
        out = [[nid, {"headline": n["headline"], "description": n["description"], "isFlashed": n["isFlashed"]}] for nid, n in sorted(news_list.items())]
    return jsonify(out)


@app.route("/api/news/latest", methods=["GET"])
def get_latest_news():
    """Returns the flashed news only (shown when admin presses Flash News). Returns None if no news is flashed."""
    err = _require_user()
    if err:
        return err
    with lock:
        flashed = [(nid, n) for nid, n in news_list.items() if n.get("isFlashed")]
        if not flashed:
            return jsonify(None)
        nid, n = flashed[0]
        out = {"headline": n["headline"], "description": n["description"], "isFlashed": True}
    return jsonify(out)


@app.route("/api/news", methods=["POST"])
def add_news():
    err = _require_admin()
    if err:
        return err
    global news_id_counter
    data = request.get_json() or {}
    headline = (data.get("headline") or "").strip()
    description = (data.get("description") or "").strip()
    if not headline:
        return jsonify({"error": "Headline required"}), 400
    with lock:
        _save_admin_snapshot()
        news_id_counter += 1
        nid = news_id_counter
        news_list[nid] = {"headline": headline, "description": description, "isFlashed": False}
    socketio.emit("news_updated")
    return jsonify({"ok": True, "id": nid})


@app.route("/api/news/<int:news_id>/flash", methods=["POST"])
def flash_news(news_id):
    err = _require_admin()
    if err:
        return err
    with lock:
        if news_id not in news_list:
            return jsonify({"error": "News not found"}), 404
        _save_admin_snapshot()
        # Only one news item should be flashed at a time on the screen.
        for nid in news_list:
            news_list[nid]["isFlashed"] = False
        news_list[news_id]["isFlashed"] = True
    socketio.emit("news_flashed", {"newsId": news_id})
    n = news_list[news_id]
    socketio.emit("news_flash_display", {"headline": n["headline"], "description": n["description"]})
    return jsonify({"ok": True})


# ----- Leaderboard -----
@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    err = _require_user()
    if err:
        return err
    with lock:
        sorted_teams = sorted(teams.items(), key=lambda x: -x[1]["totalValue"])
        out = [[name, t["totalValue"]] for name, t in sorted_teams]
    return jsonify(out)


# ----- Trading -----
@app.route("/api/trade/buy", methods=["POST"])
def buy_stock():
    err = _require_team_or_admin()
    if err:
        return err
    data = request.get_json() or {}
    team_name = (data.get("teamName") or "").strip() or _caller_team_name()
    stock_name = (data.get("stockName") or "").strip()
    quantity = int(data.get("quantity", 0))
    if not team_name or not stock_name or quantity <= 0:
        return jsonify({"error": "Invalid request"}), 400
    if session.get("role") == "team" and team_name != session.get("team_name"):
        return jsonify({"error": "Can only trade for your own team"}), 403
    with lock:
        if not market_state["isOpen"]:
            return jsonify({"error": "Market is closed"}), 400
        if team_name not in teams:
            return jsonify({"error": "Team not found"}), 404
        if stock_name not in stocks:
            return jsonify({"error": "Stock not found"}), 404
        team = teams[team_name]
        stock = stocks[stock_name]
        total_price = stock["price"] * quantity
        if team["cash"] < total_price:
            return jsonify({"error": "Insufficient funds"}), 400
        team["cash"] -= total_price
        team["portfolio"][stock_name] = team["portfolio"].get(stock_name, 0) + quantity
        _update_team_total_value(team_name)
    socketio.emit("teams_updated")
    socketio.emit("stocks_updated")
    return jsonify({"ok": True})


@app.route("/api/trade/sell", methods=["POST"])
def sell_stock():
    err = _require_team_or_admin()
    if err:
        return err
    data = request.get_json() or {}
    team_name = (data.get("teamName") or "").strip() or _caller_team_name()
    stock_name = (data.get("stockName") or "").strip()
    quantity = int(data.get("quantity", 0))
    if not team_name or not stock_name or quantity <= 0:
        return jsonify({"error": "Invalid request"}), 400
    if session.get("role") == "team" and team_name != session.get("team_name"):
        return jsonify({"error": "Can only trade for your own team"}), 403
    with lock:
        if not market_state["isOpen"]:
            return jsonify({"error": "Market is closed"}), 400
        if team_name not in teams:
            return jsonify({"error": "Team not found"}), 404
        if stock_name not in stocks:
            return jsonify({"error": "Stock not found"}), 404
        team = teams[team_name]
        current = team["portfolio"].get(stock_name, 0)
        if current < quantity:
            return jsonify({"error": "Insufficient stock quantity"}), 400
        stock = stocks[stock_name]
        team["cash"] += stock["price"] * quantity
        if current == quantity:
            del team["portfolio"][stock_name]
        else:
            team["portfolio"][stock_name] = current - quantity
        _update_team_total_value(team_name)
    socketio.emit("teams_updated")
    socketio.emit("stocks_updated")
    return jsonify({"ok": True})


@app.route("/api/trade/short", methods=["POST"])
def short_stock():
    """Short sell: borrow shares, sell at current price. Profit if price falls; cover later by buying back."""
    err = _require_team_or_admin()
    if err:
        return err
    data = request.get_json() or {}
    team_name = (data.get("teamName") or "").strip() or _caller_team_name()
    stock_name = (data.get("stockName") or "").strip()
    quantity = int(data.get("quantity", 0))
    if not team_name or not stock_name or quantity <= 0:
        return jsonify({"error": "Invalid request"}), 400
    if session.get("role") == "team" and team_name != session.get("team_name"):
        return jsonify({"error": "Can only trade for your own team"}), 403
    with lock:
        if not market_state["isOpen"]:
            return jsonify({"error": "Market is closed"}), 400
        if team_name not in teams:
            return jsonify({"error": "Team not found"}), 404
        if stock_name not in stocks:
            return jsonify({"error": "Stock not found"}), 404
        team = teams[team_name]
        if "shortPositions" not in team:
            team["shortPositions"] = {}
        stock = stocks[stock_name]
        # Sell borrowed shares: team receives cash
        team["cash"] += stock["price"] * quantity
        team["shortPositions"][stock_name] = team["shortPositions"].get(stock_name, 0) + quantity
        _update_team_total_value(team_name)
    socketio.emit("teams_updated")
    socketio.emit("stocks_updated")
    return jsonify({"ok": True})


@app.route("/api/trade/cover", methods=["POST"])
def cover_short():
    """Cover (close) a short: buy back shares at current price to return borrowed shares."""
    err = _require_team_or_admin()
    if err:
        return err
    data = request.get_json() or {}
    team_name = (data.get("teamName") or "").strip() or _caller_team_name()
    stock_name = (data.get("stockName") or "").strip()
    quantity = int(data.get("quantity", 0))
    if not team_name or not stock_name or quantity <= 0:
        return jsonify({"error": "Invalid request"}), 400
    if session.get("role") == "team" and team_name != session.get("team_name"):
        return jsonify({"error": "Can only trade for your own team"}), 403
    with lock:
        if not market_state["isOpen"]:
            return jsonify({"error": "Market is closed"}), 400
        if team_name not in teams:
            return jsonify({"error": "Team not found"}), 404
        if stock_name not in stocks:
            return jsonify({"error": "Stock not found"}), 404
        team = teams[team_name]
        short_positions = team.get("shortPositions", {})
        current_short = short_positions.get(stock_name, 0)
        if current_short < quantity:
            return jsonify({"error": "Insufficient short position to cover"}), 400
        stock = stocks[stock_name]
        cost = stock["price"] * quantity
        if team["cash"] < cost:
            return jsonify({"error": "Insufficient funds to cover short"}), 400
        team["cash"] -= cost
        if current_short == quantity:
            del short_positions[stock_name]
        else:
            short_positions[stock_name] = current_short - quantity
        _update_team_total_value(team_name)
    socketio.emit("teams_updated")
    socketio.emit("stocks_updated")
    return jsonify({"ok": True})


# ----- Backup / Restore API -----
@app.route("/api/backup", methods=["GET"])
def backup_download():
    """Admin only. Returns full snapshot JSON (frontend can save as file)."""
    err = _require_admin()
    if err:
        return err
    with lock:
        snapshot = _build_snapshot()
    return jsonify(snapshot)


@app.route("/api/backup/restore", methods=["POST"])
def backup_restore():
    """Admin only. Body = snapshot JSON. Replaces in-memory state and notifies clients."""
    err = _require_admin()
    if err:
        return err
    raw = request.get_data(as_text=True)
    if not raw:
        return jsonify({"error": "No backup data"}), 400
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid JSON: {e!s}"}), 400
    if not isinstance(data, dict) or "version" not in data:
        return jsonify({"error": "Invalid backup format (missing version)"}), 400
    with lock:
        _apply_snapshot(data)
    socketio.emit("stocks_updated")
    socketio.emit("teams_updated")
    socketio.emit("market_state_updated")
    socketio.emit("news_updated")
    return jsonify({"ok": True, "message": "State restored from backup"})


# Module-level status for auto-save (read by status endpoint)
_last_auto_save_path = None
_last_auto_save_at = None


def _run_auto_save():
    """Background: every AUTO_BACKUP_INTERVAL_SEC, write snapshot to BACKUP_DIR/auto/ and latest.json."""
    global _last_auto_save_path, _last_auto_save_at
    import time
    auto_dir = os.path.join(BACKUP_DIR, "auto")
    os.makedirs(auto_dir, exist_ok=True)
    while True:
        time.sleep(AUTO_BACKUP_INTERVAL_SEC)
        if AUTO_BACKUP_INTERVAL_SEC <= 0:
            break
        with lock:
            snapshot = _build_snapshot()
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        path_ts = os.path.join(auto_dir, f"backup-{ts}.json")
        path_latest = os.path.join(BACKUP_DIR, "latest.json")
        try:
            with open(path_ts, "w") as f:
                json.dump(snapshot, f, indent=2)
            with open(path_latest, "w") as f:
                json.dump(snapshot, f, indent=2)
            _last_auto_save_path = path_latest
            _last_auto_save_at = snapshot.get("createdAt")
        except Exception as e:
            print("Auto-backup failed:", e)


@app.route("/api/backup/auto-save-status", methods=["GET"])
def backup_auto_status():
    """Admin only. Returns whether auto-save is on and last save time/path if any."""
    err = _require_admin()
    if err:
        return err
    return jsonify({
        "autoBackupIntervalSec": AUTO_BACKUP_INTERVAL_SEC,
        "lastAutoSavePath": _last_auto_save_path,
        "lastAutoSaveAt": _last_auto_save_at,
    })


# ----- Chaos card -----
last_chaos_card = None

@app.route("/api/chaos/latest", methods=["GET"])
def chaos_latest():
    err = _require_user()
    if err:
        return err
    return jsonify({"card": last_chaos_card})

@app.route("/api/chaos/spin", methods=["POST"])
def chaos_spin():
    global last_chaos_card
    err = _require_admin()
    if err:
        return err
    card = random.choice(CHAOS_CARDS)
    last_chaos_card = card
    socketio.emit("chaos_card_display", {"card": card})
    return jsonify({"ok": True, "card": card})


# ----- Socket.IO (optional: for instant push; frontend can also poll) -----
@socketio.on("connect")
def on_connect():
    emit("connected", {"data": "Connected"})


# Optional: restore state from backup file on startup (e.g. after crash)
_restore_path = os.environ.get("RESTORE_FROM_BACKUP", "").strip()
if _restore_path and os.path.isfile(_restore_path):
    try:
        with open(_restore_path, "r") as f:
            _restore_data = json.load(f)
        with lock:
            _apply_snapshot(_restore_data)
        print("Restored state from", _restore_path)
    except Exception as e:
        print("Restore from backup failed:", e)

# Start auto-save thread if interval > 0
if AUTO_BACKUP_INTERVAL_SEC > 0:
    _auto_save_thread = Thread(target=_run_auto_save, daemon=True)
    _auto_save_thread.start()
    print("Auto-backup every", AUTO_BACKUP_INTERVAL_SEC, "sec to", BACKUP_DIR)

@app.route("/api/admin/undo", methods=["POST"])
def admin_undo():
    """Admin: undo the last stocks/news change captured in snapshot."""
    global last_admin_snapshot, news_id_counter
    err = _require_admin()
    if err:
        return err
    with lock:
        if not last_admin_snapshot:
            return jsonify({"error": "Nothing to undo"}), 400
        snapshot = last_admin_snapshot
        stocks.clear()
        stocks.update(copy.deepcopy(snapshot["stocks"]))
        news_list.clear()
        news_list.update(copy.deepcopy(snapshot["news_list"]))
        news_id_counter = snapshot["news_id_counter"]
        # Recompute team totals based on restored prices
        for team_name in teams:
            _update_team_total_value(team_name)
        last_admin_snapshot = None
    socketio.emit("stocks_updated")
    socketio.emit("teams_updated")
    socketio.emit("news_updated")
    return jsonify({"ok": True})

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve built frontend for production and SPA deep links."""
    if path.startswith("api/") or path.startswith("socket.io"):
        return jsonify({"error": "Not found"}), 404

    if path:
        candidate = os.path.join(FRONTEND_DIST_DIR, path)
        if os.path.isfile(candidate):
            return send_from_directory(FRONTEND_DIST_DIR, path)

    index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.isfile(index_file):
        return send_from_directory(FRONTEND_DIST_DIR, "index.html")

    return jsonify({
        "error": "Frontend build not found. Run `npm run build` inside the frontend directory before starting production server."
    }), 503


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Arthvidya Stock Exchange backend running at http://{host}:{port}")
    print("Use VITE_API_URL=http://127.0.0.1:5000 when running frontend (npm run dev)")
    print("Backup: GET /api/backup (download), POST /api/backup/restore (restore). Set RESTORE_FROM_BACKUP to restore on startup.")
    socketio.run(app, host=host, port=port, debug=debug_mode)



