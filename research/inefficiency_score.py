import os
import sys
import json
import requests
import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import acf
from pmdarima import auto_arima
from sklearn.metrics import mean_squared_error
import warnings
warnings.filterwarnings("ignore")

API_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "")
ticker  = sys.argv[1] if len(sys.argv) > 1 else "SNDL"

def get_price_data(ticker):
    url = (
        f"https://www.alphavantage.co/query"
        f"?function=TIME_SERIES_DAILY"
        f"&symbol={ticker}"
        f"&apikey={API_KEY}"
    )
    response = requests.get(url)
    data     = response.json()

    if "Time Series (Daily)" not in data:
        raise ValueError(f"No data returned for {ticker}")

    series = data["Time Series (Daily)"]
    df = pd.DataFrame.from_dict(series, orient="index")
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()
    df.columns = ["open", "high", "low", "close", "volume"]
    df = df.astype(float)
    df["returns"] = df["close"].pct_change()
    return df.dropna()

def autocorrelation_score(returns):
    acf_vals = acf(returns, nlags=5, fft=False)[1:]
    return round(float(np.mean(np.abs(acf_vals))), 4)

def volatility_clustering_score(returns):
    squared  = returns ** 2
    acf_vals = acf(squared, nlags=5, fft=False)[1:]
    return round(float(np.mean(np.abs(acf_vals))), 4)

def arima_edge_score(returns):
    if len(returns) < 30:
        return 0.0, 0
    train_size = int(len(returns) * 0.8)
    train      = returns.iloc[:train_size]
    test       = returns.iloc[train_size:]
    baseline_rmse = np.sqrt(mean_squared_error(
        test, np.full(len(test), train.mean())
    ))
    history = list(train)
    model = auto_arima(history, seasonal=False, 
                       error_action='ignore', suppress_warnings=True)
    try:
        preds   = []
        for i in range(len(test)):
            yhat  = model.predict(n_periods=1)[0]
            preds.append(yhat)
            history.append(test.iloc[i])
        arima_rmse = np.sqrt(mean_squared_error(test, preds))
        return round(float(max(0, baseline_rmse - arima_rmse)), 6), train_size
    except Exception:
        return 0.0, train_size

def analyze(ticker, df=None):
    if df is None:
        df      = get_price_data(ticker)
    returns = df["returns"]

    ac_score   = autocorrelation_score(returns)
    vc_score   = volatility_clustering_score(returns)
    edge_score, train_size = arima_edge_score(returns)

    ac_normalized   = min(ac_score / 0.20, 1.0) * 40
    vc_normalized   = min(vc_score / 0.20, 1.0) * 30
    edge_normalized = min(edge_score / 0.05, 1.0) * 30
    final           = round(ac_normalized + vc_normalized + edge_normalized, 2)

    ## adjustment to add forward return predictability edge
    test_df = df.iloc[train_size:]
    forward_return = (test_df["close"].iloc[-1] - 
                      test_df["close"].iloc[0]) / test_df["close"].iloc[0]

    latest_close = round(df["close"].iloc[-1], 4)
    avg_volume = int(df["volume"].mean())
    return {
        "ticker":       ticker.upper(),
        "inefficiency": final,
        "forward_return": round(forward_return, 4),
        "reliable": "true" if avg_volume > 2_000_000 and latest_close < 24 else "false",
        "components": {
            "autocorrelation":       ac_score,
            "volatility_clustering": vc_score,
            "arima_edge":            edge_score
        },
        "price": {
            "latest_close": latest_close,
            "avg_volume":       avg_volume
        }
    }

if __name__ == "__main__":
    try:
        result = analyze(ticker)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({ "error": str(e) }))