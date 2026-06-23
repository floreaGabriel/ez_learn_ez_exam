# sqlrunner — backend Node pentru "Interogare Live".
# Conecteaza la Azure SQL Edge si serveste interogari read-only.
FROM node:22-alpine

WORKDIR /app

# Instaleaza doar dependentele (mssql) — cache bun la rebuild
COPY package.json ./
RUN npm install --omit=dev

COPY server.js init.sql ./

ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3001/sqlapi/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
