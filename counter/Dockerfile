# Counter — micro-serviciu Node fără dependențe (imagine mică).
FROM node:22-alpine

WORKDIR /app
COPY server.js ./

ENV PORT=3000
ENV DATA_FILE=/data/stats.json
EXPOSE 3000

# Volum pentru persistența contorului total
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
