# Audience AI

**Founder Engagement Operating System** — paste a LinkedIn post, and a 7-agent
pipeline reads it, decides the smartest way to engage with it, writes several
comment options, rewrites them in your voice, scores them, and ranks them.

```
Frontend (Next.js)  →  Backend (FastAPI)  →  7-agent pipeline  →  LLM
        :3000               :8000                                :8080 (local) or OpenAI
                              ↓
                         PostgreSQL
```

---

## 1. Requirements

| Needed | Why |
|---|---|
| **Node.js 18+** | Runs the frontend |
| **Python 3.10+** | Runs the backend |
| **PostgreSQL** (running, reachable) | Every analyzed post and comment is stored here. The app will not start without it. |
| **An LLM**, pick one: | Every agent except ranking makes an LLM call |
| → **Option A (simple): an OpenAI API key** | Just works, costs money per request, no GPU needed |
| → **Option B (local/free): a GPU + a GGUF model + `llama-server.exe`** | What this repo is currently configured for — needs an NVIDIA GPU with ~4GB+ VRAM, and you must supply the model files yourself (see §4) |

You do **not** need: AWS S3, PostHog, Qdrant, Neo4j, Anthropic/Gemini, Clerk.
Despite some early planning docs floating around mentioning these, none of
that is wired up — adding it now would be pure overhead with nothing using it.

---

## 2. First-time setup

```bash
git clone <this-repo>
cd copilot
```

Then just run `start.bat` (Windows). On first run it will automatically:
- Create `Backend\.env` from `Backend\.env.example`
- Create a Python virtualenv and install `Backend\requirements.txt`
- Create `frontend\.env.local` from `frontend\.env.example`
- Run `npm install` for the frontend

**Before that first run finishes being useful**, open `Backend\.env` and fill in:
- `DATABASE_URL` — a real, reachable Postgres connection string
- Either `LLM_API_KEY` (real OpenAI key, leave `LLM_BASE_URL` blank) **or** `LLM_BASE_URL` (pointing at your local `llama-server.exe`, see §4)

Not on Windows, or want to start things manually? See §6.

---

## 3. Running it

Double-click `start.bat`, or from a terminal:

```bash
start.bat
```

This opens three windows:

| Service | URL | What it is |
|---|---|---|
| LLM server | http://localhost:8080 | Only if using local model — loads the GGUF model, takes a few seconds |
| Backend | http://localhost:8000/docs | FastAPI, the 7-agent pipeline |
| Frontend | http://localhost:3000 | The actual app |

Open **http://localhost:3000** and you're in.

---

## 4. Using a local model instead of OpenAI

If you want the free/local route (what this repo is currently set up for):

1. Get [`llama-server.exe`](https://github.com/ggml-org/llama.cpp/releases) (the CUDA build if you have an NVIDIA GPU) and a `.gguf` model file (we used Nous-Hermes-2-Mistral-7B-DPO, Q4_K_S quant).
2. Put **both** in the `models/` folder — `llama-server.exe` needs its sibling DLLs too (`ggml*.dll`, `llama.dll`, `libcurl-x64.dll`, plus CUDA's `cublas64_12.dll`/`cublasLt64_12.dll`/`cudart64_12.dll` if using GPU). All of these go in `models/`, flat, no subfolders.
3. In `Backend\.env`, set:
   ```
   LLM_API_KEY=not-needed
   LLM_MODEL=<whatever you named your model>
   LLM_BASE_URL=http://localhost:8080/v1
   ```
4. If `start.bat`'s `%GGUF%` filename doesn't match your model's filename, edit the `set "GGUF="` line near the top of `start.bat`.

**Don't want to deal with any of this?** Just use Option A instead — set `LLM_API_KEY` to a real OpenAI key in `Backend\.env` and leave `LLM_BASE_URL` blank. Everything else works identically either way; the backend doesn't know or care which one it's talking to.

---

## 5. What each screen does

| Screen | What it's for |
|---|---|
| **Mission Control** (`/dashboard`) | Overview — recent posts you've analyzed, strategy distribution, engagement totals |
| **Analyze Post** (`/analyze`) | Paste post **text** (most reliable), or upload a screenshot/PDF. Click "Run Intelligence." Takes **1–4 minutes** on a local model — there's no streaming progress, just an honest "this takes a while" indicator |
| **Strategy Center** (`/strategy`) | Shows *why* the AI chose to engage the way it did — one of 7 possible strategies, picked for this specific post, with its reasoning. Not interactive — it's a transparency window, not a tool |
| **Comment Lab** (`/comments`) | The actual output: ranked comments with quality scores. Copy one, or mark it "posted" and log how it performed later |

**Important**: pasting a LinkedIn **URL** mostly doesn't work — most posts require login to view, and the scraper has no session/cookies. Use pasted **text** instead; it's the fully reliable path.

---

## 6. Manual start (no `start.bat` / not on Windows)

```bash
# Terminal 1 — LLM server (skip if using OpenAI)
cd models
./llama-server.exe -m your-model.gguf --port 8080 --gpu-layers 999 --flash-attn

# Terminal 2 — Backend
cd Backend
python -m venv .venv
.venv/Scripts/activate        # .venv/bin/activate on Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev
```

---

## 7. Environment variables reference

### `Backend/.env`

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@host:5432/dbname` |
| `LLM_API_KEY` | **Yes** | Real OpenAI key, or any placeholder string if using a local server |
| `LLM_MODEL` | **Yes** | `gpt-4o` for OpenAI, or your local model's name |
| `LLM_BASE_URL` | No | Leave blank for OpenAI; set to `http://localhost:8080/v1` for local |
| `MISTRAL_API_KEY` | No | Only for screenshot OCR; falls back to local Tesseract if unset |
| `CORS_ORIGINS` | No | Defaults to `["http://localhost:3000"]` |
| `QUALITY_MIN_SCORE` | No | Defaults to `40` (out of 50) — comments below this get filtered |

### `frontend/.env.local`

| Variable | Required? | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Defaults to `http://localhost:8000` |

---

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend won't start, Postgres auth error | Wrong password in `DATABASE_URL` — check it matches your actual Postgres setup |
| LLM window shows `'llama-server.exe' is not recognized...` | This is misleading — it usually means a **missing DLL**, not a missing file. Make sure every `.dll` listed in §4 is sitting next to `llama-server.exe` in `models/` |
| Analyze Post spins forever | Check all 3 windows are still open. If the backend or LLM server window closed, the request can't ever complete — requests now time out after 10 minutes with a clear error instead of hanging forever, but if it's been less than that, just check the windows |
| URL input gives generic/wrong analysis | Expected — see §5, use pasted text instead |
| Screenshot input fails | Set `MISTRAL_API_KEY`, or install Tesseract OCR locally |

---

## 9. Project structure

```
copilot/
├── start.bat              # one-click start for all 3 services (Windows)
├── models/                # put llama-server.exe + .gguf + DLLs here (gitignored, not committed)
├── Backend/                # FastAPI + the 7-agent pipeline
│   ├── agents/             # Intake → Context → Strategy → Generation → Voice → Quality → Ranking
│   ├── api/routes/         # posts, comments, users, voice
│   └── db/                 # SQLAlchemy models (User, Post, GeneratedComment, VoiceProfile)
└── frontend/               # Next.js app (Dashboard, Analyze, Strategy, Comments)
```
