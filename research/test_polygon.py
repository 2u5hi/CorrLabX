import os
import requests

API_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "")
ticker  = "SNDL"

url = (
    f"https://www.alphavantage.co/query"
    f"?function=TIME_SERIES_DAILY"
    f"&symbol={ticker}"
    f"&apikey={API_KEY}"
)

response = requests.get(url)
data     = response.json()

keys = list(data.keys())
print(f"Keys    : {keys}")

if "Time Series (Daily)" in data:
    series  = data["Time Series (Daily)"]
    dates   = list(series.keys())[:3]
    print(f"Count   : {len(series)}")
    print(f"Latest  : {dates[0]}")
    print(f"Sample  : {series[dates[0]]}")
else:
    print(f"Response: {data}")
