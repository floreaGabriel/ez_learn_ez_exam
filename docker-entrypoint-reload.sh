#!/bin/sh
# ============================================================
#  Entrypoint nginx cu HOT-RELOAD automat al configului.
#  Urmărește /etc/nginx/conf.d și, când se schimbă un fișier de config,
#  validează (nginx -t) și reîncarcă (nginx -s reload) — FĂRĂ downtime și
#  FĂRĂ să strice site-ul dacă noul config e invalid (rămâne pe cel vechi).
#
#  Pentru ca watcher-ul să „vadă" editările, montează DIRECTORUL conf.d
#  (nu un singur fișier) în docker-compose:
#     - ./conf.d:/etc/nginx/conf.d:ro
# ============================================================
set -e
CONF_DIR=/etc/nginx/conf.d

watch_reload() {
  # close_write = editare în loc; create/move/delete = salvare prin rename (nano/vim)
  while inotifywait -q -e modify,create,delete,move,close_write "$CONF_DIR" >/dev/null 2>&1; do
    sleep 1   # debounce (lasă editorul să termine de scris)
    if nginx -t >/dev/null 2>&1; then
      nginx -s reload && echo "[nginx] config schimbat -> reîncărcat automat ✅"
    else
      echo "[nginx] config INVALID -> NU reîncarc (rulează 'nginx -t' ca să vezi eroarea) ⚠️"
    fi
  done
}

watch_reload &
exec nginx -g 'daemon off;'
