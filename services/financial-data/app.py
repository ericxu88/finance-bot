"""
Financial Data Service - Fetches live market data and economic indicators.
This runs as a separate microservice that the backend API calls.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
from fredapi import Fred
import os
from datetime import datetime, timedelta
import pandas as pd

app = Flask(__name__)
CORS(app)

# Initialize FRED API (optional - endpoints fail gracefully if no key)
fred = None
if os.getenv('FRED_API_KEY'):
    fred = Fred(api_key=os.getenv('FRED_API_KEY'))


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "financial-data"})


@app.route('/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    """
    Fetch live stock data for a given ticker.
    NOT for embedding - for live context injection.
    """
    try:
        stock = yf.Ticker(ticker.upper())

        # Get recent price history (30 days)
        hist = stock.history(period="1mo")

        # Get key info
        info = stock.info

        # Build response - handle missing/None values
        current_price = info.get('currentPrice')
        if current_price is None:
            current_price = info.get('regularMarketPrice')

        response = {
            "ticker": ticker.upper(),
            "current_price": current_price,
            "market_cap": info.get('marketCap'),
            "pe_ratio": info.get('trailingPE'),
            "dividend_yield": info.get('dividendYield'),
            "52_week_high": info.get('fiftyTwoWeekHigh'),
            "52_week_low": info.get('fiftyTwoWeekLow'),
            "sector": info.get('sector'),
            "industry": info.get('industry'),
            "recent_prices": {
                "dates": hist.index.strftime('%Y-%m-%d').tolist() if not hist.empty else [],
                "close": hist['Close'].tolist() if not hist.empty else [],
                "volume": hist['Volume'].tolist() if not hist.empty else [],
            },
            "metadata": {
                "fetched_at": datetime.now().isoformat(),
                "source": "Yahoo Finance"
            }
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/economic-indicators', methods=['GET'])
def get_economic_indicators():
    """
    Fetch current economic indicators from FRED.
    NOT for embedding - for live context injection.
    """
    if fred is None:
        return jsonify({
            "error": "FRED_API_KEY not set. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html"
        }), 503

    try:
        indicators = {
            'inflation_rate': {
                'series_id': 'CPIAUCSL',
                'name': 'Consumer Price Index (Inflation)',
            },
            'fed_funds_rate': {
                'series_id': 'FEDFUNDS',
                'name': 'Federal Funds Rate',
            },
            'unemployment_rate': {
                'series_id': 'UNRATE',
                'name': 'Unemployment Rate',
            },
            'gdp_growth': {
                'series_id': 'GDP',
                'name': 'GDP',
            },
            '10y_treasury': {
                'series_id': 'DGS10',
                'name': '10-Year Treasury Rate',
            }
        }

        result = {}

        for key, indicator in indicators.items():
            try:
                series = fred.get_series(indicator['series_id'])
                if series is None or len(series) < 2:
                    continue
                latest = series.iloc[-1]
                prev = series.iloc[-2]
                change = float(latest) - float(prev)

                result[key] = {
                    'name': indicator['name'],
                    'current_value': float(latest),
                    'previous_value': float(prev),
                    'change': change,
                    'date': str(series.index[-1])[:10],
                    'source': 'Federal Reserve Economic Data (FRED)'
                }
            except Exception:
                continue

        return jsonify({
            'indicators': result,
            'metadata': {
                'fetched_at': datetime.now().isoformat()
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/market-summary', methods=['GET'])
def get_market_summary():
    """
    Get major market indices for context.
    """
    try:
        indices = {
            '^GSPC': 'S&P 500',
            '^DJI': 'Dow Jones',
            '^IXIC': 'NASDAQ',
            '^VIX': 'Volatility Index'
        }

        result = {}

        for symbol, name in indices.items():
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                hist = ticker.history(period='5d')

                current = info.get('regularMarketPrice') or info.get('currentPrice')
                prev_close = info.get('previousClose') or (hist['Close'].iloc[-2] if len(hist) >= 2 else current)
                if current is None or prev_close is None or prev_close == 0:
                    change_pct = 0
                else:
                    change_pct = ((current - prev_close) / prev_close) * 100

                result[symbol] = {
                    'name': name,
                    'current': current,
                    'previous_close': prev_close,
                    'change_percent': round(change_pct, 2),
                    'recent_trend': hist['Close'].tolist() if not hist.empty else []
                }
            except Exception:
                continue

        return jsonify({
            'indices': result,
            'metadata': {
                'fetched_at': datetime.now().isoformat()
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
