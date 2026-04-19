CorrLabX
Market inefficiency scanner for low-cap equities.

CorrLabX is a quantitative research tool designed to identify statistically significant behavioral patterns in penny stocks and low-cap equities. It evaluates whether historical price structure in less efficient markets exhibits stronger exploitable characteristics than large-cap indices.

Future Work**
Next steps focus on completing the signal → decision → evaluation pipeline by adding strategy abstractions, backtesting capabilities, and a cached data layer for scalable experimentation.

The Idea
Efficient Market Hypothesis suggests prices reflect all available information. However, market efficiency is not uniform across instruments. Large-cap indices such as the NASDAQ Composite are heavily arbitraged by institutional and algorithmic participants, resulting in reduced exploitable structure.

Even in these efficient markets, prior analysis shows a 2.7% directional improvement over random baseline using ARIMA under strict walk-forward validation.

Low-cap equities and penny stocks exist in a significantly less efficient regime due to lower liquidity, reduced coverage, and limited institutional participation. This project tests whether the same statistical signals strengthen under reduced efficiency conditions.

CorrLabX is built to quantify that hypothesis.

How the Score Works
Each ticker is assigned a 0–100 inefficiency score based on three components:

Autocorrelation (40%) — Measures persistence in return behavior. Higher values indicate stronger temporal dependence.

Volatility Clustering (30%) — Measures whether volatility occurs in predictable regimes rather than randomly.

ARIMA Edge (30%) — Measures out-of-sample improvement over a naive baseline using walk-forward validation. This is the only component strictly evaluated on unseen data.

These scores are descriptive, not predictive. They measure structural pattern strength rather than providing directional signals.

Stack
Frontend — React, Vite, Tailwind CSS, deployed on Vercel
Backend — Node.js, Express
Quant Engine — Python, pandas, statsmodels, scikit-learn
Data — Alpha Vantage API (daily unadjusted OHLCV, free tier)

Project Structure
CorrLabX/
├── backend/
│   └── server.js
├── frontend/
│   └── src/
│       └── App.jsx
├── research/
│   ├── inefficiency_score.py
│   ├── test_polygon.py
│   └── tests/
│       └── test_scoring.py
└── .env

Setup
Clone the repository and install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Create a .env file in the root directory:

```
ALPHA_VANTAGE_KEY=your_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Start backend:

```bash
cd backend && npm start
```

Start frontend:

```bash
cd frontend && npm run dev
```

Navigate to [http://localhost:5173](http://localhost:5173), enter a ticker, and run analysis. Execution time is 30–60 seconds due to walk-forward ARIMA computation.

Deployment

Backend (Railway):
1. Push repo to GitHub
2. New Railway project → Deploy from GitHub → set root directory to `backend/`
3. Set environment variables in Railway dashboard: `ALPHA_VANTAGE_KEY`, `PORT`, `FRONTEND_URL` (your Vercel URL)
4. Railway will use `nixpacks.toml` to install Node and Python automatically

Frontend (Vercel):
1. New Vercel project → import from GitHub → set root directory to `frontend/`
2. Set environment variable `VITE_API_URL` to your Railway backend URL

Limitations

* Alpha Vantage free tier limits historical depth (100–500 data points depending on ticker)
* ARIMA component performance is sensitive to available history length
* Score is based on historical structure only and is not a trading signal
* Low-liquidity instruments may exhibit noise-driven artifacts in scoring

Related Work
This system is based on prior research analyzing correlation structure in financial time series. That work demonstrates that raw price correlation between NASDAQ and S&P 500 is inflated due to non-stationarity and must be evaluated using return-based methods, rolling correlation, and out-of-sample validation.

CorrLabX extends this framework by evaluating whether similar structural signals scale across market efficiency regimes.

References
Granger, C. & Newbold, P. (1974). Spurious regressions in econometrics. Journal of Econometrics.
Yule, G. (1926). Why do we sometimes get nonsense correlations between time series? Journal of the Royal Statistical Society.
Alpha Vantage — alphavantage.co
