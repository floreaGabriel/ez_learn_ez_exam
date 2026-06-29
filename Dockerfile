# Licență Trainer — aplicație web statică (HTML/CSS/JS) servită cu nginx.
# Imagine mică, fără build step (nu există backend / bundler).
FROM nginx:1.27-alpine

# inotify-tools = pentru hot-reload automat al configului nginx
RUN apk add --no-cache inotify-tools

# Configurația nginx (gzip, charset utf-8, cache) — config implicit din imagine.
# Pe Pi, montează DIRECTORUL conf.d ca să poți edita la cald (vezi scriptul).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Script de pornire cu watcher care reîncarcă nginx la schimbarea configului
COPY docker-entrypoint-reload.sh /docker-entrypoint-reload.sh
RUN chmod +x /docker-entrypoint-reload.sh

# Conținutul aplicației (.dockerignore exclude fișierele inutile)
COPY . /usr/share/nginx/html
# nu servi scriptul de pornire ca fișier static
RUN rm -f /usr/share/nginx/html/docker-entrypoint-reload.sh

EXPOSE 80

# Verificare de sănătate: pagina principală răspunde
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["/docker-entrypoint-reload.sh"]
