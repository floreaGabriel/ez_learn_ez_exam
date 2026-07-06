# retelistan — serverul de PREZENȚĂ online al jocului „Rețelistan" (WebSocket).
# Fără gameplay pe server: doar nume + poziții, difuzate tuturor. Totul în
# memorie (efemer) — fără volume, fără bază de date. Clientul jocului e servit
# de imaginea site-ului static (retele/harta/game.js), nu de aici.
FROM node:22-alpine

WORKDIR /app

# doar dependența ws — cache bun la rebuild
COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./

ENV PORT=3004
EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3004/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
