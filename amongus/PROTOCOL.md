# Among Us CS — protocolul WebSocket

Toate mesajele sunt JSON cu un câmp `t` (tipul). Endpoint: `wss://<host>/amongus/ws`
(nginx proxează `/amongus/` către serviciul Node de pe portul 3003, cu upgrade).

Principiu: **serverul e autoritar**. Clientul trimite *intenții* (direcție, use,
kill, vot); serverul validează totul (distanțe, cooldown-uri, roluri, soluții) și
retransmite *stare*. Informația sensibilă nu pleacă spre cine nu are voie s-o vadă:

- rolul de impostor merge DOAR către impostori (`rol`);
- soluțiile minijocurilor nu pleacă niciodată — clientul primește doar enunțul
  cu variantele amestecate, iar răspunsul e verificat pe server;
- cei vii primesc în snapshot doar jucătorii vii din raza de vizibilitate
  (anti-wallhack); fantomele văd tot;
- chatul fantomelor e retransmis doar fantomelor.

## Client → server

| `t` | câmpuri | descriere |
|---|---|---|
| `create` | `nume` | creează o cameră; răspuns `joined` + `lobby` |
| `join` | `cod, nume` | intră într-o cameră existentă (doar în LOBBY) |
| `reconnect` | `cod, playerId` | reia sesiunea după o cădere de net (și în timpul partidei) |
| `leave` | — | părăsește camera |
| `materie` | `id` | (gazdă) comută o materie în/din selecție (max 3) |
| `impostori` | `n` | (gazdă) 1 sau 2 impostori |
| `culoare` | `idx` | își alege culoarea (0–7, dacă e liberă) |
| `ready` | `ready` | gata / nu-s gata |
| `start` | — | (gazdă) pornește partida (min. 4 conectați, toți ready) |
| `input` | `dx, dy` | direcția de mers, fiecare ∈ {-1,0,1}; serverul integrează |
| `taskOpen` | `tid` | deschide taskul (trebuie să fii lângă stația lui) |
| `taskSubmit` | `tid, raspuns` | răspunsul minijocului (vezi formatele mai jos) |
| `taskClose` | — | a renunțat la taskul deschis |
| `kill` | `target` | (impostor) ucide ținta din apropiere (cooldown) |
| `report` | — | raportează un cadavru din apropiere → ședință |
| `emergency` | — | butonul din Cafeteria → ședință de urgență |
| `sabotaj` | — | (impostor) pornește supraîncălzirea kernelului |
| `fix` | `on` | ține apăsat (true) / a plecat (false) la punctul de reparat |
| `vote` | `target` \| `null` | votul din ședință (`null` = skip); morții nu pot |
| `chat` | `text` | în ședință (cei vii); fantomele oricând, doar între ele |
| `ping` | — | răspuns `pong` |

### Formatul câmpului `raspuns` (per tip de minijoc)

| tip | răspuns | semnificație |
|---|---|---|
| `fire` | `{alegeri:[idxDreapta,…]}` | pentru fiecare element din stânga (în ordine), indexul potrivit din coloana dreaptă (amestecată) |
| `ordonare` | `{ordine:[idxItem,…]}` | indecșii pieselor (din lista amestecată) în ordinea aleasă |
| `calibrare` | `{valoare: n}` | valoarea la care ai oprit acul |
| `stiva` | `{operatii:["push"\|"pop",…]}` | secvența de operații; serverul o rejoacă |
| `arbore` | `{secventa:[val,…]}` | valorile nodurilor în ordinea atinsă |
| `sortare` | `{rezultat:[n,…]}` | șirul după exact o trecere de bubble sort |
| `stari` | `{alegeri:[idxEticheta,…]}` | pentru fiecare săgeată (în ordine), indexul etichetei alese |
| `sql` | `{alegeri:[idxFragment,…]}` | pentru fiecare gol (în ordine), indexul fragmentului ales |

Validarea se face pe **valori**, nu pe indecși — amestecarea diferă per instanță.

## Server → client

| `t` | câmpuri | descriere |
|---|---|---|
| `joined` | `cod, playerId, materii[]` | confirmarea intrării + lista materiilor disponibile |
| `lobby` | `cod, faza, hostId, materii[], maxMaterii, impostori, minPlayers, maxPlayers, jucatori[]` | starea lobby-ului (retrimisă la orice schimbare) |
| `error` | `msg` | mesaj de eroare prietenos |
| `startat` | `faza` | partida a început |
| `rol` | `rol, colegi[]` | **privat**: `crew` (colegi gol) sau `impostor` (+ colegii impostori) |
| `tasks` | `fake, lista[{tid,statie,materie,tip,nume,done}]` | lista personală de taskuri; `fake=true` la impostor (nu contează în bară) |
| `roster` | `jucatori[{id,nume,color,viu,connected}]` | tabelul jucătorilor (nume/culori/viață) |
| `snap` | `now, jucatori[], bodies[], me{x,y,viu,kill,urgente,sabo}, sabotaj` | snapshot 20/s, **filtrat per destinatar** (vezi principiile) |
| `progres` | `done, total` | bara globală de taskuri a echipajului |
| `task` | `tid, tip, materie, spec` | instanța minijocului (enunț amestecat, fără soluție) |
| `taskRezultat` | `tid, ok, done` | verdictul serverului; `ok=false` permite reîncercarea |
| `taskInchis` | — | serverul a închis taskul (te-ai îndepărtat de stație) |
| `mort` | — | **privat**: ai fost ucis; devii fantomă |
| `sabotaj` | `activ, tip, ramas` | alarmă pornită/oprită |
| `meeting` | `tip, reporter, victima, faza, pana, jucatori[]` | s-a convocat ședința (corp/urgență) |
| `meetingFaza` | `faza:"vot", pana` | discuția s-a terminat, începe votul |
| `votat` | `cine` | X a votat (fără a dezvălui cu cine) |
| `chat` | `from, nume, color, text, mort` | mesaj de chat (rutat după regulile de mai sus) |
| `eject` | `id, nume, color, eraImpostor, egalitate, voturi{}` | rezultatul votului + dezvăluirea voturilor |
| `reluat` | — | ședința s-a încheiat, jocul continuă (toți la spawn) |
| `final` | `castiga, motiv, impostori[]` | finalul partidei + dezvăluirea impostorilor |
| `pong` | — | răspuns la `ping` |

## Fluxul unei partide

```
create/join → lobby (materii, impostori, culori, ready) → start
  → startat + rol(privat) + tasks + roster
  → bucla PLAY: input/snap 20Hz · taskOpen→task→taskSubmit→taskRezultat
      · kill → mort(privat) + cadavru în snap
      · report/emergency → meeting → chat → meetingFaza(vot) → vote → eject
          → reluat (sau final)
      · sabotaj → alarmă + countdown → fix(on) ținut apăsat → reparat
          (sau expiră → final impostori)
  → final → (după ~12s) lobby, pentru revanșă
```

## Condiții de câștig (verificate pe server după fiecare eveniment)

- **Echipajul**: toate taskurile terminate SAU toți impostorii ejectați/morți.
- **Impostorii**: nr. impostori vii ≥ nr. echipaj viu SAU sabotajul critic expiră.
