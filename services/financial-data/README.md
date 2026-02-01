# Financial Data Service

Python microservice that fetches **live** market data and economic indicators. This data is **not** embedded; it is fetched on-demand and injected into the Investment Agent context.

## Endpoints

- `GET /health` – Health check
- `GET /stock/<ticker>` – Live stock data (Yahoo Finance)
- `GET /economic-indicators` – FRED economic indicators (requires `FRED_API_KEY`)
- `GET /market-summary` – Major indices (S&P 500, Dow, NASDAQ, VIX)

## Setup

```bash
cd services/financial-data
pip install -r requirements.txt
```

## Environment

- `FRED_API_KEY` – Optional. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html  
  Without it, `/economic-indicators` returns 503.
- `PORT` – Default 5001
- `FLASK_DEBUG` – Set to `true` for debug mode

## Run

```bash
# From project root
npm run start:financial-service

# Or from this directory
python3 app.py
```

## Backend integration

Set in your main app `.env`:

```
FINANCIAL_DATA_SERVICE_URL=http://localhost:5001
```

The Investment Agent calls this service when analyzing invest actions and injects live economic and market context into the prompt.
