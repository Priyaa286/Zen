# Zen — AI-Powered Cross-Border Shopping Agent

Zen is an AI-powered cross-border shopping assistant that helps users discover international products, compare prices, estimate shipping costs, taxes, and currency conversions, and understand the total purchase cost. With secure PayPal checkout and order tracking, Zen makes global shopping simple, transparent, and hassle-free.

---

## 🛠️ Tech Stack
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic, HTTPX
- **Local AI**: Ollama running `qwen3:4b` (or configurable model)
- **Frontend**: React / Vite (configured with CORS)
- **Database & Integrations (Upcoming Phases)**: MongoDB, PayPal REST API

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+
- [Ollama](https://ollama.ai) (for local LLM inference)

---

### 2. Ollama Setup & Model Download

1. **Install Ollama**:
   - Download and install Ollama from [ollama.ai/download](https://ollama.ai/download) for your OS (Windows, macOS, or Linux).
2. **Start Ollama**:
   Ollama typically starts automatically as a background service on `http://localhost:11434`. You can verify by opening:
   ```bash
   http://localhost:11434
   ```
   Or run in terminal:
   ```bash
   ollama serve
   ```
3. **Pull the Qwen3 4B Model**:
   ```bash
   ollama run qwen3:4b
   ```
   *(You can also configure another model via `OLLAMA_MODEL` in `.env` if desired).*

---

### 3. Backend Setup

1. **Navigate to the backend directory**:
   ```powershell
   cd Zen/backend
   ```

2. **Activate the Virtual Environment**:
   - Windows PowerShell:
     ```powershell
     .\venv\Scripts\activate
     ```
   - Linux/macOS:
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```powershell
   copy .env.example .env
   ```
   Available AI configurations:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen3:4b
   OLLAMA_TIMEOUT=60
   ```

5. **Start the FastAPI Server**:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

---

### 4. Testing & Verification

#### Run Pytest
All tests (health endpoints, error handling, mock Ollama requirement extraction, timeout and connection handling) run offline with mocks:
```powershell
pytest -v
```

#### Test Chat Endpoint (`POST /api/v1/chat`)

**PowerShell**:
```powershell
$body = @{
    message = "Find a handmade ceramic tea set from Japan under 8000 INR, delivered to Bengaluru within three weeks."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat" -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 5
```

**cURL**:
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find a handmade ceramic tea set from Japan under 8000 INR, delivered to Bengaluru within three weeks."}'
```

**Interactive Swagger Documentation**:
Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
