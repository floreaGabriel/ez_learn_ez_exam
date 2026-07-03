# Licență Trainer — aplicație web statică (HTML/CSS/JS) servită cu nginx.
# Imagine mică, fără build step (nu există backend / bundler).
FROM nginx:1.27-alpine

# Versiune assets pentru cache-busting (CI o setează la git sha). Se adaugă
# ca ?v=... pe JS/CSS în index.html => userii văd modificările la refresh
# normal, fără hard-reload (index.html e oricum no-cache).
ARG ASSET_VER=dev

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

# Cache-busting: adaugă ?v=<ASSET_VER> pe toate referințele locale css/js din
# index.html. La fiecare deploy versiunea se schimbă => browserul (care ia mereu
# index.html proaspăt) cere automat JS/CSS-ul nou. Userii NU mai dau hard-reload.
RUN sed -i -E "s|(href=\"css/[^\"]*)\"|\1?v=${ASSET_VER}\"|g; s|(src=\"js/[^\"]*)\"|\1?v=${ASSET_VER}\"|g" /usr/share/nginx/html/index.html
# Idem pentru laboratorul PSO: simulatoarele (sims/*.js) primesc ?v=<sha>
# (pso/index.html e no-cache — vezi nginx.conf — deci referințele proaspete
#  ajung la utilizator la fiecare deploy).
RUN sed -i -E "s|(src=\"sims/[^\"]*)\"|\1?v=${ASSET_VER}\"|g" /usr/share/nginx/html/pso/index.html
# ... și blobul criptat cu subiectele PSO, referit din pso/subiecte.html
RUN sed -i -E "s|(src=\"subiecte-secret[^\"]*)\"|\1?v=${ASSET_VER}\"|g" /usr/share/nginx/html/pso/subiecte.html

EXPOSE 80

# Verificare de sănătate: pagina principală răspunde.
# User-Agent explicit, ca healthcheck-ul să NU fie prins de filtrul anti-bot
# din nginx.conf (care blochează UA-uri de scripting și cereri fără UA).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -U "healthcheck-intern" -O- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["/docker-entrypoint-reload.sh"]
