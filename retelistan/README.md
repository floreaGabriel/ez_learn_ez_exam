# retelistan — server de prezență online 🌐

Serviciul care face jocul **Rețelistan** (tabul „harta" din materia Rețele)
„online": jucătorii intră cu un nume și se văd unii pe alții pe hartă, în timp
real. **Nu ține gameplay pe server** — progresul (teorie citită, fapte-cheie,
porți deschise) rămâne în `localStorage`-ul fiecărui jucător. Serverul doar
difuzează nume + poziții.

- **Stack:** Node 22 + `ws`. Un singur fișier: `server.js`.
- **Stare:** 100% în memorie (efemeră) — fără volume, fără bază de date.
- **Port:** 3004 (`ENV PORT`). nginx proxează `location ^~ /retelistan/`
  (upgrade WebSocket) către el; clientul se conectează la `/retelistan/ws`.
- **Health:** `GET /health` → `{ok, online}` (folosit de HEALTHCHECK).

## Protocol (JSON pe WebSocket)

| Direcție | Mesaj | Sens |
|---|---|---|
| client → server | `{t:"j", nume}` | intrare în lume (nume 2–14 caractere, sanitizat pe server) |
| server → client | `{t:"ok", id}` | id-ul tău |
| client → server | `{t:"p", x, y, d, m, r}` | poziție (px), direcție, în mișcare?, regiunea curentă — max ~10/s |
| server → toți | `{t:"s", j:[[id,nume,x,y,dir,misca,reg],…]}` | instantaneu cu toți jucătorii (difuzat la ~8/s doar când s-a mișcat ceva) |

## Limite (anti-abuz)

- max **80** de jucători simultan, max **4** conexiuni per IP (`X-Forwarded-For` de la nginx);
- mesaje de max **1 KB** (`maxPayload`), poziții acceptate doar în limitele hărții;
- rate-limit pe poziții (min. 50 ms între ele — restul se ignoră);
- 5 mesaje invalide ⇒ deconectare; ping/pong la 30 s ⇒ conexiunile moarte se închid.

## Local, fără docker

```bash
cd retelistan && npm install && node server.js   # pornește pe :3004
```
Clientul din `retele/harta/game.js` merge oricum și **offline** — dacă
WebSocket-ul nu răspunde, jocul rulează single-player și reîncearcă discret.
