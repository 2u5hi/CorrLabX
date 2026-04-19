FROM node:20-bookworm-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./backend/
RUN npm install --prefix backend

COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY research ./research

CMD ["node", "backend/server.js"]
