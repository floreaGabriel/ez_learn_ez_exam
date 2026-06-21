# Licență Trainer — aplicație web statică (HTML/CSS/JS) servită cu nginx.
# Imagine mică, fără build step (nu există backend / bundler).
FROM nginx:1.27-alpine

# Configurația nginx (gzip, charset utf-8, cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Conținutul aplicației (.dockerignore exclude fișierele inutile)
COPY . /usr/share/nginx/html

EXPOSE 80

# Verificare de sănătate: pagina principală răspunde
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
