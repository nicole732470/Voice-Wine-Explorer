# Voice Wine Explorer 🍷

---

## Overview

This project demonstrates how to combine large language models (LLMs) with structured data systems.

Instead of letting the AI generate answers directly, the system:

1. Uses AI to parse natural language into structured queries  
2. Executes those queries deterministically on a local dataset  
3. Returns grounded, reliable results  

---

## Features

- Natural language wine search (e.g. “best wines under $50”)
- Voice input using browser speech recognition
- AI-powered query parsing (via OpenRouter)
- Deterministic query execution on local data
- Text-to-speech playback of answers
- Fully grounded responses (no hallucination)

---

## Example Questions

- Which are the best-rated wines under $50?
- What do you have from Burgundy?
- Show me sparkling wines from France under $80
- Which bottles would make a good housewarming gift?

---

## Architecture

### 1. User Input
- Text input or voice input (SpeechRecognition API)

### 2. AI Query Parsing
- Sends user question to OpenRouter API
- Converts it into structured JSON:

```json
{
  "filters": [...],
  "sort": {...},
  "limit": 3
}

### 3. Query Execution (runWineQuery.js)
	•	Applies:
	•	filter (WHERE)
	•	sort (ORDER BY)
	•	limit (LIMIT)
	•	Works like a simplified SQL engine in JavaScript

### 4. Output
	•	Displays matching wines
	•	Speaks results using browser speech synthesis

---

## Why This Design

Instead of using SQL directly, this project uses an in-memory dataset + JavaScript query engine.

Trade-offs

Pros
	•	Simple and fast to build
	•	Fully deterministic
	•	Easy to debug
	•	Perfect for small datasets

Cons
	•	Not scalable for large data
	•	No indexing or persistence

---


## Tech Stack
	•	React (Vite)
	•	Node.js (Express)
	•	OpenRouter API (LLM)
	•	Web Speech API (speech-to-text & text-to-speech)

---

## Project Structure

src/
  App.jsx
  data/
    wines.json
  utils/
    runWineQuery.js
server/
  server.js

---

## How to Run

1. Install dependencies
npm install
2. Start backend
node server/server.js
3. Start frontend
npm run dev

---