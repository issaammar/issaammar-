"""Arrow Maze backend API tests."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://maze-flow-play.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- health ----
class TestHealth:
    def test_root_ok(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"
        assert "message" in body


# ---- players ----
class TestPlayers:
    def test_create_player_returns_id_and_name(self, session):
        name = f"TEST_{uuid.uuid4().hex[:8]}"
        r = session.post(f"{API}/players", json={"name": name})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["name"] == name
        assert "id" in body and body["id"]

    def test_create_player_idempotent_same_name(self, session):
        name = f"TEST_idem_{uuid.uuid4().hex[:6]}"
        r1 = session.post(f"{API}/players", json={"name": name})
        r2 = session.post(f"{API}/players", json={"name": name})
        assert r1.status_code == 200 and r2.status_code == 200
        assert r1.json()["id"] == r2.json()["id"], "POST /players must be idempotent for same name"

    def test_create_player_rejects_empty(self, session):
        r = session.post(f"{API}/players", json={"name": "   "})
        assert r.status_code in (400, 422)

    def test_get_player_unknown_returns_404(self, session):
        r = session.get(f"{API}/players/{uuid.uuid4()}")
        assert r.status_code == 404


# ---- scores ----
class TestScores:
    @pytest.fixture(scope="class")
    def player(self, session):
        name = f"TEST_score_{uuid.uuid4().hex[:6]}"
        r = session.post(f"{API}/players", json={"name": name})
        assert r.status_code == 200
        return r.json()

    def test_submit_score_all_fields(self, session, player):
        payload = {
            "player_id": player["id"],
            "player_name": player["name"],
            "level_id": "1",
            "time_ms": 4321,
            "moves": 3,
            "grid_size": 3,
            "arrow_count": 3,
        }
        r = session.post(f"{API}/scores", json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        for k, v in payload.items():
            assert body[k] == v
        assert "id" in body and body["id"]
        assert "_id" not in body

    def test_submit_multiple_and_leaderboard_sorted(self, session, player):
        # Submit 3 with varying times for a unique level so we can verify sort
        level = f"TEST_LVL_{uuid.uuid4().hex[:5]}"
        for t in [9000, 1500, 4500]:
            r = session.post(
                f"{API}/scores",
                json={
                    "player_id": player["id"],
                    "player_name": player["name"],
                    "level_id": level,
                    "time_ms": t,
                    "moves": 5,
                    "grid_size": 3,
                    "arrow_count": 3,
                },
            )
            assert r.status_code == 200

        r = session.get(f"{API}/scores/leaderboard/{level}")
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 3
        times = [row["time_ms"] for row in rows]
        assert times == sorted(times), f"leaderboard not sorted asc: {times}"
        # no _id leakage
        for row in rows:
            assert "_id" not in row

    def test_global_leaderboard(self, session):
        r = session.get(f"{API}/scores/leaderboard")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        if rows:
            times = [row["time_ms"] for row in rows]
            assert times == sorted(times)
            for row in rows:
                assert "_id" not in row
                assert "player_name" in row and "level_id" in row


# ---- stats ----
class TestStats:
    def test_stats_aggregates_correctly(self, session):
        name = f"TEST_stats_{uuid.uuid4().hex[:6]}"
        pr = session.post(f"{API}/players", json={"name": name})
        assert pr.status_code == 200
        player = pr.json()

        # 2 scores on level "1" (best=2000), 1 on "2"
        for t in [5000, 2000]:
            session.post(
                f"{API}/scores",
                json={
                    "player_id": player["id"],
                    "player_name": name,
                    "level_id": "1",
                    "time_ms": t,
                    "moves": 4,
                    "grid_size": 3,
                    "arrow_count": 3,
                },
            ).raise_for_status()
        session.post(
            f"{API}/scores",
            json={
                "player_id": player["id"],
                "player_name": name,
                "level_id": "2",
                "time_ms": 7000,
                "moves": 6,
                "grid_size": 4,
                "arrow_count": 5,
            },
        ).raise_for_status()

        r = session.get(f"{API}/stats/{player['id']}")
        assert r.status_code == 200, r.text
        s = r.json()
        assert s["player_id"] == player["id"]
        assert s["player_name"] == name
        assert s["levels_completed"] == 2
        assert s["total_plays"] == 3
        assert s["total_moves"] == 4 + 4 + 6
        assert s["best_times"]["1"] == 2000
        assert s["best_times"]["2"] == 7000

    def test_stats_unknown_player_404(self, session):
        r = session.get(f"{API}/stats/{uuid.uuid4()}")
        assert r.status_code == 404
