# amongus — serverul „Among Us CS” (WebSocket) + clientul jocului.
# Conținutul minijocurilor (content/*.yaml) e copiat în imagine; SOLUȚIILE
# rămân pe server — clientul primește doar enunțuri amestecate (anti-cheat).
# Clientul (public/) e servit tot de acest proces => client și server pleacă
# mereu împreună, din aceeași imagine (protocol garantat sincron).
FROM node:22-alpine

WORKDIR /app

# doar dependențele (ws + js-yaml) — cache bun la rebuild
COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY public ./public
COPY content ./content

ENV PORT=3003
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3003/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
