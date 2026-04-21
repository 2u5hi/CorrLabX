from inefficiency_score import analyze
import yfinance as yf
import pandas as pd

TICKERS = [
    "SNDL", "OCGN", "ATER", "SPIR", "CRBP", "KOSS", "CENN", "BBIG", "ACB", "TLRY",
    "HIMS", "BFRI", "JAGX", "NKLA", "WKHS", "NVAX", "SRPT", "GERN", "ONTX", "INPX",
    "BNGO", "MVIS", "NNDM", "XELA", "CLOV", "TRVG", "SAVE", "GNUS", "SHIP", "DARE",
    "CYCC", "OBSV", "SELB", "ATNF", "LIQT", "CETX", "BFIN", "AULT", "EDSA", "MNOV"
]


def fetch_yfinance_data(ticker):
    data = yf.download(ticker, period="1y", interval="1d", auto_adjust=True, progress=False)
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = [col[0].lower() for col in data.columns]
    else:
        data.columns = [c.lower() for c in data.columns]
    if "close" not in data.columns:
        raise ValueError(f"No close column found for {ticker}")
    data["returns"] = data["close"].pct_change()
    return data.dropna()

results = []
for ticker in TICKERS:
    try:
        df = fetch_yfinance_data(ticker)
        if df['volume'].mean() < 2000000:
            print(f"Skipping {ticker} due to low average volume")
            continue
        # set max price to 24 dollars a share
        if df['close'].mean() > 24:
            print(f"Skipping {ticker} due to high average price")
            continue
        result = analyze(ticker, df)
        results.append(result)
    except Exception as e:
        print(f"Error occurred while processing {ticker}: {e}")

df_results = pd.DataFrame(results)
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)
print(df_results)