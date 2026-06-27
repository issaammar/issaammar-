from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Arrow Maze API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------

class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PlayerCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name cannot be empty")
        if len(v) > 24:
            raise ValueError("name too long")
        return v


class Score(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    player_name: str
    level_id: str           # "1".."10" for handcrafted, "infinite" for procedural
    time_ms: int            # ms to clear
    moves: int              # number of taps used
    grid_size: int          # board size NxN
    arrow_count: int        # arrows cleared
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScoreCreate(BaseModel):
    player_id: str
    player_name: str
    level_id: str
    time_ms: int
    moves: int
    grid_size: int
    arrow_count: int


class LeaderboardEntry(BaseModel):
    player_name: str
    level_id: str
    time_ms: int
    moves: int
    grid_size: int
    arrow_count: int
    created_at: datetime


class PlayerStats(BaseModel):
    player_id: str
    player_name: str
    levels_completed: int
    total_plays: int
    total_moves: int
    best_times: dict  # { level_id: best_time_ms }


# ---------- Helpers ----------

def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"message": "Arrow Maze API", "status": "ok"}


@api_router.post("/players", response_model=Player)
async def create_or_get_player(payload: PlayerCreate):
    name = payload.name.strip()
    existing = await db.players.find_one({"name": name}, {"_id": 0})
    if existing:
        return Player(**existing)
    player = Player(name=name)
    await db.players.insert_one(player.model_dump())
    return player


@api_router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str):
    doc = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="player not found")
    return Player(**doc)


@api_router.post("/scores", response_model=Score)
async def submit_score(payload: ScoreCreate):
    score = Score(**payload.model_dump())
    await db.scores.insert_one(score.model_dump())
    return score


@api_router.get("/scores/leaderboard", response_model=List[LeaderboardEntry])
async def leaderboard_global(limit: int = 50):
    """Top scores across all levels sorted by time ascending."""
    cursor = db.scores.find({}, {"_id": 0}).sort("time_ms", 1).limit(min(limit, 200))
    items = await cursor.to_list(length=limit)
    return [LeaderboardEntry(**s) for s in items]


@api_router.get("/scores/leaderboard/{level_id}", response_model=List[LeaderboardEntry])
async def leaderboard_level(level_id: str, limit: int = 50):
    cursor = (
        db.scores.find({"level_id": level_id}, {"_id": 0})
        .sort("time_ms", 1)
        .limit(min(limit, 200))
    )
    items = await cursor.to_list(length=limit)
    return [LeaderboardEntry(**s) for s in items]


@api_router.get("/stats/{player_id}", response_model=PlayerStats)
async def player_stats(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="player not found")
    cursor = db.scores.find({"player_id": player_id}, {"_id": 0})
    scores = await cursor.to_list(length=1000)

    best_times: dict = {}
    total_moves = 0
    completed = set()
    for s in scores:
        total_moves += int(s.get("moves", 0))
        lid = s["level_id"]
        completed.add(lid)
        t = int(s["time_ms"])
        if lid not in best_times or t < best_times[lid]:
            best_times[lid] = t

    return PlayerStats(
        player_id=player_id,
        player_name=player["name"],
        levels_completed=len(completed),
        total_plays=len(scores),
        total_moves=total_moves,
        best_times=best_times,
    )


@api_router.get("/scores/recent", response_model=List[LeaderboardEntry])
async def recent_scores(limit: int = 30):
    cursor = db.scores.find({}, {"_id": 0}).sort("created_at", -1).limit(min(limit, 200))
    items = await cursor.to_list(length=limit)
    return [LeaderboardEntry(**s) for s in items]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
