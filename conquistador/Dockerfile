# conquistador — server multiplayer (WebSocket) pentru jocul de cucerire.
# Întrebările (YAML) sunt copiate în imagine; răspunsurile corecte rămân
# pe server (clientul nu le primește decât la "reveal").
FROM node:22-alpine

WORKDIR /app

# Instaleaza doar dependentele (ws + js-yaml) — cache bun la rebuild
COPY package.json ./
RUN npm install --omit=dev

# toate sursele .js (server + hărți: map.js, map-europa.js, eventuale viitoare)
COPY *.js ./
COPY questions ./questions

ENV PORT=3002
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
