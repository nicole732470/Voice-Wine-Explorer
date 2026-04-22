# 🍷 Voice Wine Explorer

A grounded, voice-enabled wine search powered by LLMs and deterministic query execution.
video demo: https://northwestern.zoom.us/rec/share/REpDPpHlyM-FodpSwHF0yAYXX_om5jgqn_2-LgPOZIKO76JZUFx0E1b_a5W7j-RJ.KW6V2PVmapVYytkx?startTime=1776215158000

## Overview

Instead of letting the AI generate answers directly, this system uses a three-step approach to ensure reliable, grounded results:

1. Use AI to parse natural language into structured queries
2. Execute those queries deterministically on a local dataset
3. Return results grounded in real data — no hallucination

## Features

- Natural language wine search (e.g. "best wines under $50")
- Voice input via browser Speech Recognition API
- AI-powered query parsing via OpenRouter
- Deterministic query execution on local data
- Text-to-speech playback of results

## Example Questions

- Which are the best-rated wines under $50?
- What do you have from Burgundy?
- Show me sparkling wines from France under $80
- Which bottles would make a good housewarming gift?

## Architecture

### 1. User Input

Text typed directly, or spoken via the browser `SpeechRecognition` API.

### 2. AI Query Parsing

Sends the user's question to OpenRouter and converts it into structured JSON:

```json
{
  "filters": [...],
  "sort": { "field": "rating", "order": "desc" },
  "limit": 3
}
```

### 3. Query Execution

Runs the structured query against an in-memory dataset via `runWineQuery.js` — a lightweight JavaScript engine supporting filter, sort, and limit, similar to a simplified SQL engine.

### 4. Output

Displays matching wines in the UI and speaks results aloud using the browser `SpeechSynthesis` API.

## Design Trade-offs

| | Pros | Cons |
|---|---|---|
| | Simple and fast to build | Not scalable for large datasets |
| | Fully deterministic | No indexing or persistence |
| | Easy to debug | |
| | Perfect for small datasets | |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js (Express) |
| LLM | OpenRouter API |
| Speech | Web Speech API |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start backend
node server/server.js

# 3. Start frontend
npm run dev
```
