/* ============================================================================
   RETELISTAN — theory.js: TOT conținutul de teorie, ca date (fără logică).
   ----------------------------------------------------------------------------
   Sursele conținutului (nimic inventat — doar reformulat și structurat):
   - cursurile PDF din  examen_licenta/cursuri/retele_protocoale_noi/
   - notițele verificate din  examen_licenta/materii/retele/notite/
   - rezolvările din  examen_licenta/materii/retele/rezolvari/  și subiectele
     din  examen_licenta/Subiecte/  (secțiunile „💡 De examen").
   Fiecare punct are câmpul "sursa" cu fișierul + paginile de unde provine.

   Cum adaugi conținut: adaugă un obiect în "puncte" (id unic, titlu, rezumat,
   detaliu, diagrama|null, examen|null, faptaCheie, sursa) — jocul îl plasează
   automat pe hartă. Cheile "diagrama" valide sunt definite în game.js (DATE).
   49 puncte de teorie · 8 regiuni. Generat + verificat contra surselor.
   ============================================================================ */
window.RETELISTAN_THEORY = {
  "regiuni": [
    {
      "id": "intro",
      "nume": "Satul Intro",
      "icon": "🏡",
      "sursa": "intro.pdf / Overview Protcom.pdf / Introducere in Retele 2025.pdf",
      "descriere": "Punctul de plecare în Rețelistan: afli ce e o rețea și la ce folosește, cum se clasifică (PAN/LAN/MAN/WAN), cum circulă datele — cu sau fără conexiune — și cum sunt organizate protocoalele pe niveluri, de la modelul OSI la TCP/IP și încapsularea în PDU-uri.",
      "puncte": [
        {
          "id": "ce-este-o-retea",
          "titlu": "Ce este o rețea și la ce folosește",
          "tip": "npc",
          "rezumat": "O rețea de calculatoare e o colecție interconectată de calculatoare autonome, care există ca să transmită informații, să partajeze resurse și să crească puterea de procesare și fiabilitatea.",
          "detaliu": "Cursul definește **rețeaua de calculatoare** ca o colecție **interconectată** de calculatoare **autonome**: „interconectate\" înseamnă că pot schimba informații, iar „autonome\" că nu există o relație de subordonare de tip master–slave. Mai general, o rețea leagă dispozitive/echipamente prin conexiuni digitale, pe baza unui set de reguli comune — **protocoalele de comunicații**.\n\nDe ce legăm calculatoarele între ele? Motivația din curs are patru piloni:\n- **transmiterea informațiilor** — e-mail, WWW;\n- **partajarea resurselor**: fizice (discuri, imprimante, scannere), logice (programe de sistem și aplicații) și informaționale (baze de date, fișiere);\n- **creșterea puterii de procesare** — o rețea de PC-uri poate echivala, ca putere, un supercalculator;\n- **creșterea fiabilității**.\n\nO rețea are două componente: **hardware** (medii de transmisie — cablu de cupru, fibră optică, wireless — plus dispozitive speciale: plăci de rețea, modemuri, switch-uri) și **software** (protocoalele de comunicație).\n\nCa organizare există două arhitecturi mari: **peer-to-peer**, unde toate entitățile sunt tratate egal (furnizori și/sau consumatori de resurse), cu costuri reduse, recomandată când ai puțini utilizatori, aflați într-o zonă restrânsă, iar securitatea nu e o problemă esențială; și **client/server**, cu server dedicat care satisface cât mai rapid cererile clienților, resurse centralizate (mai ușor de întreținut decât cele distribuite) și securitate stabilită printr-o politică de administrator.\n\nIar vârful poveștii e **Internetul**: cel mai mare proiect de interconectare — o „rețea de rețele\" cu miliarde de utilizatori, construită pe suita de protocoale TCP/IP.",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "Rețea = calculatoare autonome interconectate: pot schimba informații între ele și niciunul nu e master peste celălalt.",
          "sursa": "Introducere in Retele 2025.pdf p.3–9; intro.pdf p.3"
        },
        {
          "id": "clasificarea-retelelor",
          "titlu": "Clasificări: PAN, LAN, MAN, WAN",
          "tip": "terminal",
          "rezumat": "Rețelele se clasifică după aria de acoperire (PAN → LAN → MAN → WAN → Internet), după scop (intranet, extranet, darknet) și după tehnologia de transmisie (broadcast vs punct-la-punct).",
          "detaliu": "Cel mai des clasificăm rețelele **după aria de acoperire**, iar scara din curs merge de la un metru până la toată planeta:\n\n- **PAN** (Personal Area Network) — în jurul unei persoane, ordinul unui metru; include WBASN (Wireless Body Area Sensor Network);\n- **LAN** (Local Area Network) — cameră, clădire, campus (`10 m – 1 km`); variante: HAN (home), SAN (storage), WLAN (wireless). Arie redusă, interconectează sistemele unei organizații sau ale unei reședințe, cu **rate mari de transfer: 100 Mbps – 10 Gbps**;\n- **MAN** (Metropolitan Area Network) — un oraș (`~10 km`); „versiuni mai mari de LAN\", cu tehnologii similare; exemplul clasic e sistemul de televiziune prin cablu și furnizorii de servicii integrate (date, cablu TV, telefonie); include CAN (campus) și rețelele backbone;\n- **WAN** (Wide Area Network) — țară, continent (`100 – 1000 km`); a.k.a. Internet; interconectează filiale/divizii ale unei organizații, cu rate care au evoluat de la 56 Kbps – 1,5 Mbps spre 100 Gbps și costuri de implementare/operare ridicate; tehnologii: cable modem, dial-up, DSL, ATM, Frame Relay, ISDN, leased line, fibră optică, WiMAX, SD-WAN;\n- **Internetul** — rețeaua la nivel planetar (`~10.000 km`), interconectare de rețele de tipuri diferite: „rețeaua de rețele\".\n\nDupă **scop**: Intranet (rețea sub controlul exclusiv al unei singure entități), Extranet (rețea externă unei rețele locale, accesibilă via WAN — ex. portal cu furnizori și parteneri), Internet și Darknet (ex. Tor).\n\nDupă **tehnologia de transmisie**: rețele **broadcast** — un singur canal de comunicație partajat de toate calculatoarele — vs rețele **punct-la-punct** — legături dedicate între calculatoare. Iar ca **topologii**: punct-la-punct, magistrală, inel, stea, ierarhică (arborescentă), mesh și hibridă.",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "Scara ariilor de acoperire: PAN ~1 m, LAN până la 1 km (100 Mbps–10 Gbps), MAN ~10 km (orașul), WAN 100–1000 km, Internet ~10.000 km.",
          "sursa": "Introducere in Retele 2025.pdf p.10–24"
        },
        {
          "id": "conexiune-vs-pachete",
          "titlu": "Cu conexiune sau cu pachete independente",
          "tip": "totem",
          "rezumat": "Serviciile orientate pe conexiune merg ca telefonul (legătură stabilită întâi, ordinea păstrată — modelul conductei), cele neorientate ca poșta (fiecare mesaj călătorește independent); Internetul e construit pe a doua filosofie.",
          "detaliu": "Există două filosofii de a duce datele de la A la B, explicate în curs prin **tipurile de servicii**:\n\n- **Serviciile orientate pe conexiune** funcționează ca **sistemul telefonic**: întâi stabilești legătura, apoi vorbești. E „modelul conductei\": ce intră pe un capăt iese pe celălalt **în aceeași ordine**. Legătura rezervată cap-la-cap din telefonia clasică e ideea de circuit — de aici numele de comutare de circuite.\n- **Serviciile neorientate pe conexiune** funcționează ca **sistemul poștal**: fiecare mesaj e transmis **independent unul de celălalt**, cu adresa pe el, fără vreo legătură stabilită în prealabil. Pe această idee de pachete independente e construit Internetul.\n\nDovada din curs: protocolul **IP** este de tip **„best effort, connectionless\"** — nu garantează livrarea, iar **fiecare pachet este rutat în mod independent** prin rețea. Peste el, la nivelul transport, alegi:\n\n- **TCP** — orientat pe conexiune, bazat pe stări: stabilire conexiune (3-way handshake), transfer de date (cu controlul congestiei), închidere conexiune; **garantează livrarea datelor și ordinea acestora**, transmisii unicast; recomandat pentru aplicații care au nevoie de transfer fiabil: e-mail, transfer de fișiere, WWW;\n- **UDP** — neorientat pe conexiune / datagram: **nu garantează livrarea și ordinea**, dar are **overhead redus**; recomandat pentru protocoale de tip cerere-răspuns și streaming, plus transmisii multicast sau broadcast.\n\nAl treilea criteriu discutat e **calitatea (fiabilitatea) serviciului**. Morala: rețeaua de dedesubt e fără conexiuni și fără garanții — dacă vrei siguranță și ordine, le construiești deasupra, la transport.",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "IP e „best effort, connectionless\": fiecare pachet e rutat independent — siguranța și ordinea se construiesc deasupra, în TCP.",
          "sursa": "Introducere in Retele 2025.pdf p.33; intro.pdf p.14–15"
        },
        {
          "id": "protocol-si-stiva",
          "titlu": "Protocol, serviciu și stiva de protocoale",
          "tip": "cufar",
          "rezumat": "Comunicația e împărțită pe niveluri: serviciul e ce oferă un nivel, protocolul e setul de reguli dintre entitățile pereche, iar datele coboară prin stivă primind câte un antet la fiecare nivel — încapsularea.",
          "detaliu": "Comunicația între două sisteme e un proces foarte complex, așa că e **divizată în subtask-uri — niveluri** cu roluri funcționale diferite. Organizarea e **ierarhică**: fiecare nivel apelează serviciile de comunicație puse la dispoziție de nivelul inferior și oferă, la rândul lui, servicii nivelului superior. Bonusul e **interoperabilitatea**: înlocuirea unui nivel nu trebuie să afecteze funcționalitatea celorlalte.\n\nDouă definiții de aur:\n- **Serviciu** = set de primitive (operații) puse la dispoziție de un nivel;\n- **Protocol** = set de reguli ce guvernează modul de comunicare — „pe orizontală\" — între **entitățile pereche** (entitățile comunicante de pe același nivel, din cele două sisteme).\n\nNivelurile și protocoalele asociate alcătuiesc **arhitectura rețelei**, iar lista protocoalelor din cadrul unui sistem e **stiva de protocoale**.\n\nCum circulă efectiv datele? Prin **încapsulare**: la sursă, mesajul M coboară prin stivă și fiecare nivel îi lipește propriul **antet** — H4 la nivelul 4, H3 la nivelul 3, H2 la nivelul 2, care adaugă și un **trailer** T2. Pe mediul fizic pleacă doar biții; la destinație, fiecare nivel își scoate antetul în ordine inversă și predă conținutul nivelului de deasupra.\n\nExemplul concret din curs, pentru un acces web: `User data` primește **antetul HTTP**; totul devine conținutul unui **segment TCP** (antet TCP); segmentul intră într-o **datagramă IP** (antet IP); iar datagrama e împachetată într-un **cadru Ethernet**, între antetul Ethernet și trailerul Ethernet. Patru „plicuri\" puse unul în altul — ca o scrisoare băgată în plic, plicul în sac, sacul în camion.",
          "diagrama": "incapsulare",
          "examen": "2013 (Setul 2, Subiectul III.2): pentru un cadru cu antetele A-B-C-D + Application Data + FCS s-a cerut asocierea fiecărei poziții cu Ethernet, IP, TCP sau HTTP (ordinea de încapsulare); 2021, 2023: calculul overhead-ului de încapsulare pentru audio prin RTP: Ethernet 18 + IP 20 + UDP 8 + RTP 12 = 58 octeți per pachet (vezi subiect_2023.md, rezolvarea 5).",
          "faptaCheie": "Un pachet web pleacă în patru plicuri: date + antet HTTP → segment TCP → datagramă IP → cadru Ethernet (antet + trailer).",
          "sursa": "Introducere in Retele 2025.pdf p.28–31; intro.pdf p.13"
        },
        {
          "id": "modelul-osi",
          "titlu": "Modelul OSI: cele 7 niveluri",
          "tip": "terminal",
          "rezumat": "OSI e modelul teoretic de referință cu 7 niveluri — Fizic, Legătură de date, Rețea, Transport, Sesiune, Prezentare, Aplicație — fiecare cu rol și unitate de date proprie.",
          "detaliu": "**OSI (Open Systems Interconnection)** e modelul teoretic de referință, cu **7 niveluri**, fiecare cu misiunea lui:\n\n- **1. Fizic** — transmite datele prin canalul de comunicație; rezolvă problemele „hardware\": interfața mecanică (conectori, pini), interfața electrică (nivelul semnalelor), sincronizarea între emițător și receptor, mediile de comunicație. Unitatea lui: **bitul**.\n- **2. Legătură de date** — transformă nivelul fizic într-un mediu de comunicație fără erori; operează la nivel de **cadre (frame)** — ansamblu de date și informații de control; face **adresare fizică (adresa MAC)**, sincronizarea cadrelor și, opțional, controlul erorilor și al fluxului.\n- **3. Rețea** — controlează modul de operare al subrețelei de comunicație, adică dialogul dintre sistemele intermediare (**rutere**); operează cu **pachete**, pe care le rutează de la sursă la destinație (rutare statică/dinamică); face **adresare logică**, fragmentare și reasamblare de pachete, contabilizarea traficului.\n- **4. Transport** — comunicație **end-to-end**, între procesul emițător și procesul receptor: garantează livrarea datelor, identifică procesele comunicante, face controlul erorilor, controlul fluxului și calitatea serviciilor (QoS).\n- **5. Sesiune** — coordonarea și controlul dialogului între procese: stabilirea sesiunilor de lucru și sincronizarea proceselor.\n- **6. Prezentare** — sintaxa și semantica informațiilor transmise: formatarea datelor conform unui standard prestabilit (reprezentarea caracterelor ASCII/UNICODE, reprezentarea numerelor).\n- **7. Aplicație** — aplicațiile utilizator: transfer de fișiere, mesagerie electronică, sesiuni de lucru la distanță.\n\nFiecare nivel schimbă propria unitate de date (PDU): APDU, PPDU, SPDU, TPDU pentru nivelurile 7–4, apoi **pachet** la Rețea, **cadru** la Legătura de date, **bit** la Fizic. Reper rapid: 5–7 lucrează cu **date**, 4 cu **segmente**, 3 cu **pachete**, 2 cu **cadre**, 1 cu **biți**.",
          "diagrama": "osi-stack",
          "examen": null,
          "faptaCheie": "Nivelul 2 vede cadre, nivelul 3 pachete, nivelul 4 segmente — pe fir circulă doar biți.",
          "sursa": "Introducere in Retele 2025.pdf p.25, p.33–42"
        },
        {
          "id": "modelul-tcpip-vs-osi",
          "titlu": "Modelul TCP/IP și duelul cu OSI",
          "tip": "npc",
          "rezumat": "TCP/IP e modelul practic al Internetului — Application, Transport, Internet, Network Access — iar față de OSI (7 niveluri, teoretic) el e standardul de facto, construit în jurul protocoalelor reale.",
          "detaliu": "**TCP/IP** e modelul practic — *lingua franca* a Internetului: o suită de protocoale creată de **Robert Kahn și Vinton Cerf în 1974**, inclusă azi în toate sistemele de operare folosite pe scară largă. Cursul îl desenează pe **4 niveluri** (în comparații apare și varianta cu 5, când Network Access e despărțit în Fizic + Legătură de date):\n\n- **Application** (process-to-process) — comasează Aplicație + Prezentare + Sesiune din OSI: HTTP/HTTPS, DNS, DHCP, SNMP, SMTP/POP/IMAP, Telnet/SSH, FTP/SCP, NTP;\n- **Transport** (port-to-port, socket-to-socket) — **TCP**, orientat conexiune (fiabil) și **UDP**, neorientat conexiune (mai puțin fiabil);\n- **Internet** (network-to-network) — transportul pachetelor între sursă și destinație prin subrețea: rutarea pachetelor și evitarea congestiei; **IP** (IPv4/IPv6, neorientat conexiune), **ICMP** (funcții de control și interogări simple), **ARP** (maparea adreselor IP în adrese MAC), IGMP;\n- **Network Access** (device-to-device) — Ethernet, 802.11, PPP, Frame Relay, ATM.\n\nRolurile protocoalelor de aplicație, cerute la examen: **DNS** — conversia numelor în adrese IP, componentă critică a Internetului; **Telnet** — conectare de la distanță (din motive de securitate se recomandă SSH); **FTP** — transfer de fișiere între host-uri; **SMTP** — poșta electronică; **HTTP** — accesul la Web (pagini HTML); plus SNMP, POP3, IMAP, LDAP.\n\n**Comparația OSI vs TCP/IP** din curs: OSI are 7 niveluri, TCP/IP mai puține; conceptele de serviciu, interfață și protocol sunt foarte clar evidențiate în OSI; viziunea asupra transportului diferă — în OSI livrarea e garantată și protocolul e orientat conexiune; iar esențialul: **OSI e un model teoretic/conceptual, TCP/IP e standardul de facto**, construit în jurul protocoalelor deja dezvoltate. Standardizarea Internetului trece prin IETF: **Draft → RFC → Standard**.",
          "diagrama": "osi-vs-tcpip",
          "examen": "2004, 2005: pe baza schemei modelului arhitectural TCP/IP s-a cerut rolul și funcțiile fiecărui protocol din stivă: ARP, IP, ICMP, TCP, UDP, SNMP, DNS, Telnet, FTP, SMTP și HTTP.",
          "faptaCheie": "OSI e modelul teoretic cu 7 niveluri; TCP/IP e standardul de facto al Internetului, cu un singur nivel Aplicație în locul trio-ului Aplicație/Prezentare/Sesiune.",
          "sursa": "Introducere in Retele 2025.pdf p.43–48, p.51; intro.pdf p.2, p.11–17"
        }
      ],
      "recap": [
        {
          "intrebare": "Câte niveluri are modelul OSI și în ce ordine, de jos în sus?",
          "variante": [
            "7: Fizic, Legătură de date, Rețea, Transport, Sesiune, Prezentare, Aplicație",
            "7: Fizic, Rețea, Legătură de date, Transport, Sesiune, Prezentare, Aplicație",
            "4: Network Access, Internet, Transport, Application"
          ],
          "corect": 0,
          "explicatie": "OSI e modelul teoretic cu 7 niveluri exact în această ordine; varianta cu 4 niveluri descrie modelul TCP/IP, nu OSI."
        },
        {
          "intrebare": "Cum se numește unitatea de date (PDU) cu care operează nivelul Rețea?",
          "variante": [
            "cadru (frame)",
            "pachet",
            "segment",
            "bit"
          ],
          "corect": 1,
          "explicatie": "Nivelul Rețea rutează pachete; cadrele aparțin nivelului Legătură de date, segmentele Transportului, iar biții nivelului Fizic."
        },
        {
          "intrebare": "Ce caracterizează un serviciu neorientat pe conexiune, așa cum e IP?",
          "variante": [
            "Stabilește întâi o legătură cap-la-cap, ca un apel telefonic",
            "Păstrează garantat ordinea mesajelor, după modelul conductei",
            "Transmite fiecare mesaj/pachet independent de celelalte, ca sistemul poștal"
          ],
          "corect": 2,
          "explicatie": "Serviciile neorientate pe conexiune urmează analogia poștală: fiecare pachet călătorește independent; IP e „best effort, connectionless\", fiecare pachet fiind rutat independent."
        }
      ]
    },
    {
      "id": "semnale",
      "nume": "Câmpia Semnalelor",
      "icon": "🌊",
      "sursa": "Transmisii de Date 2026.pdf",
      "descriere": "Aici înveți fizica din spatele rețelelor: cum devin datele semnale, cât de repede pot curge biții printr-un mediu, cum se modulează și se codifică, și pe ce călătoresc — cupru, fibră sau unde radio.",
      "puncte": [
        {
          "id": "semnale-analogice-vs-digitale",
          "titlu": "Semnale analogice vs digitale",
          "tip": "terminal",
          "rezumat": "Datele circulă prin rețea sub formă de semnale electrice, electromagnetice sau impulsuri luminoase — fie analogice (undă continuă), fie digitale (impulsuri de tensiune).",
          "detaliu": "Tot ce trimiți în rețea — text, imagini, audio, video — ajunge un șir de biți, iar biții ăștia trebuie să devină ceva fizic: **semnale electrice** (cabluri de cupru), **semnale electromagnetice** (transmisii radio) sau **impulsuri luminoase** (fibră optică, LiFi).\n\nDiferența de bază: semnalul **analogic** este o undă electromagnetică ce variază continuu, pe când semnalul **digital** este o secvență de impulsuri de tensiune. Datele însele pot fi și ele analogice (sunetul) sau digitale (coduri ASCII), iar conversiile se fac cu ADC/DAC — placa de sunet, modemul, codec-ul.\n\nPentru semnale periodice ai formulele de bază: `s(t+T) = s(t)`, unde **T** e perioada, `f = 1/T` frecvența, `λ = v·T` lungimea de undă și `v = λ·f` viteza de propagare. Semnalul sinusoidal e descris complet de trei parametri: `s(t) = A·sin(2πft + Φ)` — amplitudine, frecvență, fază. Iar **analiza Fourier** îți spune ceva superb: orice semnal, analogic sau digital, e format dintr-o serie de sinusoide de diferite frecvențe.\n\nDe ce au câștigat transmisiile digitale? **Rezistență mare la zgomot** și **cost mic de implementare** — de-asta le folosesc sistemele de calcul și rețelele. Poți folosi mai multe niveluri de tensiune (M-ary) ca să transmiți mai mulți biți pe simbol, dar costul și complexitatea cresc cu numărul de niveluri.\n\nBonus de terminologie: transmisiile pot fi **simplex** (o singură direcție), **half-duplex** (ambele direcții, dar pe rând) sau **full-duplex** (ambele simultan).",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "Orice semnal, analogic sau digital, este o sumă de sinusoide de diferite frecvențe — asta e analiza Fourier.",
          "sursa": "Transmisii de Date 2026.pdf p.3–14"
        },
        {
          "id": "latime-de-banda-bit-baud",
          "titlu": "Lățime de bandă, bit vs baud",
          "tip": "totem",
          "rezumat": "Lățimea de bandă e capacitatea mediului, rata de transmisie se măsoară în bps, iar legătura dintre simboluri și biți e Ri = Rs·log₂V.",
          "detaliu": "**Lățimea de bandă (bandwidth)** este capacitatea mediului de transmisie, iar **rata de transmisie (bit rate)** e volumul de date transmis în unitatea de timp, în biți pe secundă (bps). Regula de aur: cu cât lățimea de bandă a mediului e mai mare, cu atât rata de transfer suportată e mai ridicată.\n\nAici e o capcană clasică: un semnal digital are teoretic **lățime de bandă infinită**, dar sistemul de transmisie are o bandă limitată — iar limitarea benzii creează distorsiuni.\n\nDistincția **bit vs baud**: `Rs` = numărul de simboluri pe secundă (rata de modulație, în baud), `Ri` = numărul de biți pe secundă (bps). Legătura: `Ri = Rs·log₂V`, unde V e numărul de niveluri ale semnalului. Cu V=2, N baud înseamnă N bps; cu V=4, aceiași N baud cară 2N bps.\n\n**Factorii perturbatori** care strică semnalul: **atenuarea** (puterea scade cu distanța, depinde de mediu și frecvență), **banda limitată** (taie frecvențele înalte), **întârzierea** (componente de frecvențe diferite ajung la momente diferite) și **zgomotul** (termic/alb și de intermodulare) — toate pot duce la erori de bit.\n\nȘi timpii care apar la probleme: **timpul de transmisie** e cel necesar „inserării\" tuturor biților în mediu (proporțional cu dimensiunea cadrului), **timpul de propagare** e cel necesar unui bit să ajungă de la sursă la destinație (proporțional cu distanța), iar **RTT (Round-Trip Time)** e timpul total dus-întors, cu tot cu confirmare.",
          "diagrama": null,
          "examen": "2016 și 2019: calculul timpului de propagare Pământ–Lună (385.000 km la 3·10⁸ m/s ≈ 1,28 s) și al RTT-ului (≈ 2,57 s); 2019: timpul de transfer al unui fișier de 1.000.000 octeți printr-un modem de 28.800 bps.",
          "faptaCheie": "Ri = Rs·log₂V: la 4 niveluri de semnal, fiecare simbol cară 2 biți, deci N baud înseamnă 2N bps.",
          "sursa": "Transmisii de Date 2026.pdf p.10–16, 65, 81"
        },
        {
          "id": "modulatie-ask-fsk-psk",
          "titlu": "Modulație: ASK, FSK, PSK și rudele lor",
          "tip": "npc",
          "rezumat": "Orice combinație date/semnal are schema ei: date digitale pe semnal analogic folosesc ASK/FSK/PSK, datele analogice se digitizează cu PCM/DM, iar analog-pe-analog înseamnă AM/FM/PM.",
          "detaliu": "Datele analogice sau digitale pot fi codificate folosind semnale atât analogice cât și digitale — cursul organizează totul într-o matrice de patru combinații, iar schema aleasă depinde de performanțele dorite și de caracteristicile mediului.\n\n- **Date digitale → semnale digitale**: scheme de codificare (NRZ, Manchester etc.) care cresc performanța și asigură sincronizarea receptorului cu transmițătorul.\n- **Date digitale → semnale analogice**: aici intră cele trei „keying\"-uri — **ASK** (amplitude-shift keying), **FSK** (frequency-shift keying) și **PSK** (phase-shift keying). E scenariul modemului: date digitale (impulsuri binare de tensiune) devin semnal analogic modulat pe o frecvență purtătoare.\n- **Date analogice → semnale digitale**: **PCM** (Pulse Code Modulation) și **DM** (Delta Modulation).\n- **Date analogice → semnale analogice**: modulația în **amplitudine (AM)**, **frecvență (FM)** și **fază (PM)**.\n\nCa să le ții minte pe cele trei keying-uri, întoarce-te la sinusoidă: `s(t) = A·sin(2πft + Φ)` are exact trei parametri — amplitudinea A, frecvența f și faza Φ. ASK, FSK și PSK comută fiecare câte unul dintre ei ca să reprezinte biții, exact cum le spune și numele: shift de amplitudine, de frecvență, respectiv de fază.\n\nAceeași logică se vede și la AM/FM/PM pentru date analogice. Practic, toată modulația e o singură idee: iei o purtătoare sinusoidală și îi „miști\" unul dintre cei trei parametri în ritmul datelor.",
          "diagrama": "modulatii",
          "examen": null,
          "faptaCheie": "ASK, FSK și PSK modifică fiecare exact câte unul dintre cei trei parametri ai sinusoidei purtătoare: amplitudinea, frecvența sau faza.",
          "sursa": "Transmisii de Date 2026.pdf p.9, 13, 50"
        },
        {
          "id": "codari-de-linie",
          "titlu": "Codări de linie: NRZ, Manchester & co.",
          "tip": "terminal",
          "rezumat": "Transmiterea directă a biților nu e mereu eficientă — schemele de codificare (NRZ-L, NRZI, Bipolar-AMI, Manchester...) modelează spectrul și țin receptorul sincronizat.",
          "detaliu": "De ce nu trimitem biții „ca atare\"? Pentru că transmiterea directă nu e întotdeauna eficientă. O schemă bună de codificare urmărește: eliminarea frecvențelor înalte (reducerea benzii), **eliminarea componentei de curent continuu**, concentrarea puterii semnalului în mijlocul benzii, **sincronizarea între transmițător și receptor**, detecția erorilor și imunitatea la zgomot.\n\nSchemele din curs, cu regulile lor exacte:\n\n- **NRZ-L** (Nonreturn to Zero-Level): `0` = nivel înalt, `1` = nivel jos.\n- **NRZI** (NRZ Inverted): `1` = tranziție la începutul intervalului de bit, `0` = fără tranziție.\n- **Bipolar-AMI**: `0` = lipsă semnal; `1` = nivel pozitiv sau negativ, **alternant** pentru 1-urile succesive.\n- **Pseudoternary**: oglinda lui AMI — `1` = lipsă semnal, `0` = nivel alternant.\n- **Manchester**: tranziție la mijlocul fiecărui bit — `0` = de sus în jos, `1` = de jos în sus. Tranziția din mijloc e și date, și ceas.\n- **Differential Manchester**: întotdeauna tranziție la mijloc; `0` = tranziție și la începutul intervalului, `1` = fără tranziție la început.\n- **B8ZS** și **HDB3** completează lista pentru șiruri lungi de zerouri.\n\nDe ce contează sincronizarea? Receptorul trebuie să fie sincronizat cu ceasul emițătorului ca să interpreteze corect datele — dacă eșantionezi la momente greșite, citești cu totul alt șir de biți. Variațiile de semnal (tranzițiile) sunt exact ce folosește receptorul ca să-și refacă ceasul, iar eșantionarea se face la jumătatea intervalului de bit, din cauza factorilor perturbatori.",
          "diagrama": "codari",
          "examen": null,
          "faptaCheie": "În Manchester există garantat o tranziție la mijlocul fiecărui bit (0 = sus→jos, 1 = jos→sus), deci receptorul își reface ceasul direct din semnal.",
          "sursa": "Transmisii de Date 2026.pdf p.51–53, 55–56"
        },
        {
          "id": "transmisii-seriale-sincrone-asincrone",
          "titlu": "Cum pleacă biții: serial, asincron, sincron",
          "tip": "cufar",
          "rezumat": "Transmisia serială trimite un singur bit la un moment dat; sincronizarea se rezolvă fie per caracter (asincron, cu start/stop bits), fie per cadru (sincron, cu delimitatori).",
          "detaliu": "În transmisiile **seriale** pleacă un singur bit la un moment dat, iar receptorul are două întrebări existențiale: când a început transmisia? și cât durează fiecare bit? Răspunsul dat de curs: în funcție de durata sincronizării, ai **transmisii asincrone** sau **sincrone**.\n\n**Transmisiile asincrone** trimit datele caracter cu caracter (1 caracter = `5–8 biți`), cu ceasuri independente la emisie și recepție. Sincronizarea trebuie menținută doar pe durata unui caracter, pentru că receptorul se resincronizează la începutul fiecăruia: linia stă în idle, un **start bit** anunță caracterul, urmează biții de date, opțional un **bit de paritate**, apoi **stop** de 1–2 bit-times. Prețul plătit: **overhead ridicat, în jur de 20%**. Exemplul clasic: interfața serială **RS-232/V.24**.\n\n**Transmisiile sincrone** trimit un bloc întreg de biți numit **cadru (frame)**, cu receptorul sincronizat cu ceasul emițătorului pe toată durata transmisiei. Începutul și sfârșitul cadrului sunt marcate de **delimitatori**. Overhead scăzut — e cea mai folosită metodă de transmisie a datelor în rețelele de calculatoare.\n\nFormatul generic al unui cadru arată așa: **Preamble/SYNC** (șir special, de regulă `01010101...`, pentru sincronizarea receptorului după pauză) → **SD** (Start Delimiter) → **Control** (adrese, tip cadru, flag-uri, lungime, numere de secvență) → **DATA** (datele nivelului superior) → **FCS** (Frame Check Sequence, suma de control pentru detecția erorilor) → **ED** (End Delimiter, care poate lipsi dacă în câmpul de control e specificată lungimea cadrului).",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "Transmisia asincronă plătește ~20% overhead: fiecare caracter de 5–8 biți cară propriul start bit, eventual paritate și 1–2 stop bits.",
          "sursa": "Transmisii de Date 2026.pdf p.54–60"
        },
        {
          "id": "medii-de-transmisie-si-wdm",
          "titlu": "Medii de transmisie: cupru, fibră, radio + WDM",
          "tip": "npc",
          "rezumat": "Mediile sunt ghidate (coaxial, torsadat, fibră) sau neghidate (radio, microunde, satelit, infraroșu); fibra domină la viteză, iar prin WDM o singură fibră duce conexiuni multiple pe lungimi de undă diferite.",
          "detaliu": "Mediile de transmisie sunt **ghidate** (cu fir) sau **neghidate** (fără fir), iar caracteristicile transmisiei sunt determinate de mediu și de semnal — factori cheie: rata de transfer și distanța, influențate de lățimea de bandă, atenuare, interferență și numărul de receptori.\n\n**Cablul torsadat (twisted pair)**: 2 fire de cupru izolate și răsucite împreună, `1 pereche = 1 conexiune`. Torsadarea reduce **diafonia (crosstalk)** — amestecul semnalului util cu semnale din firele alăturate. Vine **neecranat (UTP)** sau **ecranat (STP)**, cu segment maxim de `100 m`. E cel mai ieftin și mai folosit mediu. Categoriile TIA/EIA 568: Cat5 (100 Mbps), Cat5e (1 Gbps), Cat6/6a (1/10 Gbps), Cat7 (10 Gbps), Cat8 (25/40 Gbps, dar tronson de doar 30 m). Conector: RJ-45 (8p8c).\n\n**Cablul coaxial**: fir de cupru rigid + izolator + conductor cilindric împletit + folie — ecranarea îl apără de interferențe. Lățime de bandă ridicată; folosit în telefonie, televiziune prin cablu (standardul **DOCSIS** pentru date peste CATV) și supraveghere video. Conectori BNC.\n\n**Fibra optică**: rată teoretică de ordinul **Tbps**, canal de `2–125 µm`, convenție puls = bit 1, lipsă puls = bit 0. Vine **singlemode** (aliniere strictă, diode laser scumpe) sau **multimode** (step-index / graded-index). Avantaje: atenuare scăzută, imunitate la câmpuri electromagnetice, nu radiază energie (greu de interceptat), distanță mare între repetoare.\n\nȘi multiplexarea din curs: **WDM (Wavelength Division Multiplexing)** — o singură fibră transportă conexiuni multiple pe lungimi de undă diferite, combinate cu un MUX și separate cu un DEMUX. Tot pe o singură fibră, **BiDi** oferă transmisie full-duplex cu fascicule de lungimi de undă diferite pe sensuri.\n\n**Mediile neghidate**: microunde, satelit, radio, infraroșu — transmisia și recepția se fac cu antene, **unidirecțional** (aliniere precisă, beamforming) sau **omnidirecțional**; cu cât frecvența e mai mare, cu atât semnalul e mai ușor de focalizat.",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "Un segment UTP ține maxim 100 m, în timp ce fibra optică atinge teoretic Tbps printr-un canal de doar 2–125 µm.",
          "sursa": "Transmisii de Date 2026.pdf p.17–49"
        }
      ],
      "recap": [
        {
          "intrebare": "Cum este codificat bitul 1 în codarea Manchester?",
          "variante": [
            "Nivel constant de tensiune pe toată durata bitului",
            "Tranziție de sus în jos la mijlocul intervalului",
            "Tranziție de jos în sus la mijlocul intervalului"
          ],
          "corect": 2,
          "explicatie": "În Manchester, 1 = tranziție de jos în sus la mijlocul intervalului, iar 0 = de sus în jos; tranziția din mijloc servește și la sincronizarea ceasului."
        },
        {
          "intrebare": "Un semnal cu V=4 niveluri, transmis la N baud, ce rată de biți atinge?",
          "variante": [
            "2N bps",
            "N bps",
            "4N bps"
          ],
          "corect": 0,
          "explicatie": "Ri = Rs·log₂V = N·log₂4 = 2N bps — fiecare simbol cu 4 niveluri cară 2 biți."
        },
        {
          "intrebare": "Care este lungimea maximă a unui segment de cablu UTP?",
          "variante": [
            "55 m",
            "100 m",
            "500 m"
          ],
          "corect": 1,
          "explicatie": "Cursul dă 100 m ca lungime maximă a segmentului UTP (valabil pentru categoriile uzuale Cat5–Cat7)."
        }
      ]
    },
    {
      "id": "lan",
      "nume": "Orașul LAN",
      "icon": "🏙️",
      "sursa": "LAN Course 2026.pdf / ethernet.md / arp.md",
      "descriere": "Aici înveți cum circulă datele într-o rețea locală: cadrul Ethernet și limitele lui, adresele MAC, protocolul CSMA/CD, diferența hub–switch, cum își construiește un switch tabela MAC, VLAN-urile 802.1Q și protocolul ARP.",
      "puncte": [
        {
          "id": "cadrul-ethernet",
          "titlu": "Cadrul Ethernet",
          "tip": "terminal",
          "rezumat": "Cadrul Ethernet e „plicul\" de nivel 2 în care călătorește orice pachet prin LAN: adrese MAC, câmpul Lungime/Tip, date și FCS, cu dimensiuni stricte între 64 și 1518 octeți.",
          "detaliu": "Înainte de cadru se transmit **Preambulul** (7 octeți, 7 × `10101010`, sincronizare în frecvență — practic clock-ul) și **SFD** (1 octet, `10101011`, sincronizare în fază). Atenție: astea două **NU fac parte din cadru**!\n\nCadrul propriu-zis are:\n- **MAC destinație** [6 octeți] — cui i se adresează cadrul (comparat cu adresa din ROM-ul plăcii);\n- **MAC sursă** [6 octeți] — cine l-a generat (de aici învață switch-ul);\n- **Lungime/Tip** [2 octeți] — dacă valoarea e `≤ 1500 (0x5DC)` reprezintă lungimea payload-ului (Ethernet 802.3); dacă e `≥ 1536 (0x600)` reprezintă tipul protocolului de nivel 3 (`0x800` = IPv4, `0x0806` = ARP) — varianta v2/ARPA folosită azi;\n- **Date (LLC + Date + PAD)** [46–1500 octeți] — payload-ul; maximul de 1500 e chiar **MTU-ul** Ethernet;\n- **FCS** [4 octeți] — CRC calculat pe întregul cadru; la recepție se recalculează și se compară. PAD-ul (0–46 octeți, completare până la minim) NU intră nici în câmpul Lungime, nici în CRC.\n\nRegula de aur: **64 ≤ cadru ≤ 1518 octeți**. Minimul de 64 există ca o coliziune să poată fi detectată înainte de terminarea transmisiei (slot time = 512 biți). Maximul de 1518 limitează timpul cât o stație ocupă mediul și dimensiunea bufferelor. Cu tag VLAN 802.1Q limitele devin **68–1522**.\n\nUn cadru e **invalid** dacă: lungimea reală nu corespunde câmpului Lungime (`Lung.rec = Lungime + 18` pentru valori ≥ 46), numărul de biți nu e multiplu de 8, sau CRC-ul nu validează cadrul.",
          "diagrama": "ethernet-frame",
          "examen": "2000: limitele min/max ale frame-ului 802.3 și de ce există; 2016: formatul cadrelor Ethernet (Preambul, MAC-uri, Tip, Date, FCS) + de ce există dimensiune minimă; 2022: MTU pentru Ethernet = 1500 octeți (vezi subiect_2022.md)",
          "faptaCheie": "Câmpul Lungime/Tip își schimbă sensul după valoare: ≤1500 înseamnă lungime, ≥1536 înseamnă tip de protocol (0x800 = IPv4, 0x0806 = ARP).",
          "sursa": "LAN Course 2026.pdf p.13–21 / ethernet.md §2–3"
        },
        {
          "id": "adresa-mac",
          "titlu": "Adresa MAC",
          "tip": "cufar",
          "rezumat": "Adresa MAC are 6 octeți: 3 pentru producător (OUI) și 3 specifici plăcii de rețea, plus doi biți speciali care spun dacă adresa e unicast/multicast și globală/locală.",
          "detaliu": "Fiecare interfață de rețea are o adresă **MAC de 6 octeți**, structurată în două jumătăți:\n- **OUI** (Organisationally Unique Identifier) — primii 3 octeți, identifică producătorul;\n- **NIC specific** — ultimii 3 octeți, aleși de producător pentru placa respectivă.\n\nÎn primul octet stau doi biți cu semnificație specială:\n- **bitul I/G** (primul bit transmis pe fir!): `0` = unicast, `1` = multicast/broadcast. Pentru că e chiar primul bit care ajunge la switch, un echipament cu comutare *cut-through* află imediat dacă are de-a face cu un cadru de grup;\n- **bitul U/L**: `0` = adresă globală unică (respectă OUI), `1` = adresă administrată local.\n\nAdrese speciale de ținut minte:\n- **Broadcast** = `FF:FF:FF:FF:FF:FF` — cadrul ajunge la toată lumea (așa pleacă ARP Request);\n- **MAC multicast IP** = `01-00-5E-xx-xx-xx` — prefixul `01-00-5E` e fix, iar în rest se copiază ultimii 23 de biți ai adresei IP multicast (ex. `01-00-5E-00-00-0A` pentru 224.0.0.10).\n\nCine folosește ce: **MAC destinație** e comparat de fiecare stație cu propria adresă ca să decidă dacă acceptă cadrul; **MAC sursă** e citit de switch pentru a-și construi tabela MAC (learning). La examen apare des extragerea adreselor MAC din dump-ul hexazecimal al unui pachet: primii 6 octeți din cadru = MAC destinație, următorii 6 = MAC sursă.",
          "diagrama": null,
          "examen": "2014, 2015, 2021: determinarea adreselor MAC destinație/sursă în hexazecimal dintr-un dump Wireshark al unui pachet capturat",
          "faptaCheie": "Primul bit transmis dintr-o adresă MAC (bitul I/G) spune dacă e unicast (0) sau multicast/broadcast (1) — broadcast = FF:FF:FF:FF:FF:FF.",
          "sursa": "LAN Course 2026.pdf p.17, 44 / ethernet.md §2"
        },
        {
          "id": "csma-cd",
          "titlu": "CSMA/CD pas cu pas",
          "tip": "totem",
          "rezumat": "CSMA/CD e metoda de acces la mediul partajat din Ethernetul clasic: asculți, transmiți, iar dacă apare coliziune te oprești, anunți cu JAM și aștepți un timp aleator (backoff exponențial binar).",
          "detaliu": "În Ethernetul clasic (half-duplex, mediu partajat) stațiile concurează pentru mediu — **acces aleator + competiție**. Algoritmul **CSMA/CD** (Carrier Sense Multiple Access with Collision Detection), pas cu pas:\n\n- 1. Stația are un cadru de transmis și **ascultă mediul** (carrier sense).\n- 2. Mediu **ocupat** → așteaptă până devine liber. Mediu **liber** → începe transmisia, continuând să asculte.\n- 3. Dacă semnalul recepționat diferă de cel transmis → **coliziune**! Stația oprește imediat transmisia.\n- 4. Trimite un **semnal JAM de 32 de biți**, ca toate stațiile să afle de coliziune.\n- 5. **Backoff exponențial binar (BEB)**: după a n-a coliziune așteaptă `k × slot_time`, unde `k` e ales aleator din `[0, 2^n − 1]`; n se plafonează la 10, iar după **16 încercări** se renunță. Aleatorul face ca stațiile să nu reintre în coliziune la același moment.\n- 6. Reia de la pasul 1.\n\nLegătura cu dimensiunea cadrului: **slot time** = timpul maxim de propagare dus-întors între cele mai îndepărtate două noduri = **512 biți = 64 octeți** la 10/100 Mbps. Dacă un cadru ar fi mai mic de 64 de octeți, stația ar putea termina transmisia înainte să afle de coliziune și n-ar mai putea retransmite corect — de aceea există PAD-ul.\n\nÎn rețelele moderne, cu **switch + full-duplex**, nu mai există coliziuni, deci CSMA/CD e dezactivat (obsolete).",
          "diagrama": "csma-cd",
          "examen": "2024: prezentarea protocolului CSMA/CD (vezi subiect_2024.md); 2016: algoritmul binary exponential backoff + de ce cadrele au dimensiune minimă; 2013: CSMA/CD + formatul cadrelor 802.3; 2000: limitele IEEE 802.3 într-un domeniu de coliziune",
          "faptaCheie": "După coliziune se trimite un JAM de 32 de biți, apoi se așteaptă k × slot_time cu k aleator din [0, 2^n−1] — maximum 16 încercări.",
          "sursa": "LAN Course 2026.pdf p.13, 15, 22 / ethernet.md §5 / subiect_2024.md §1"
        },
        {
          "id": "hub-vs-switch",
          "titlu": "Hub vs Switch",
          "tip": "npc",
          "rezumat": "Hub-ul repetă cadrul către toate stațiile (mediu partajat, coliziuni), switch-ul îl trimite doar către destinație și separă domeniile de coliziune — plus trei moduri de comutare cu compromisuri diferite.",
          "detaliu": "Într-un LAN de tip stea, totul trece prin nodul central — dar contează enorm ce e acel nod:\n- **Hub** — retransmite cadrul recepționat către **toate** celelalte stații. Toată lumea împarte același mediu, deci apar coliziuni și e nevoie de CSMA/CD.\n- **Switch** — retransmite cadrul **doar către stația destinație**, pe baza tabelei MAC. E un echipament de **Layer 2** (ISO-OSI), transparent pentru stații, iar fiecare port devine propriul **domeniu de coliziune**. Comunicația poate fi half- sau full-duplex, iar porturile pot fi simetrice (aceeași viteză) sau asimetrice (mai multă bandă spre server).\n\nDe aici și clasica întrebare din 2022: switch-ul **nu inițiază nicio interogare ARP** când comută un pachet de la A la B — lucrează la nivelul 2, comută cadre pe baza adreselor MAC din tabela CAM, fără să analizeze adresa IP.\n\nModurile de comutare (cum procesează switch-ul cadrul):\n- **Store-and-forward** — salvează **tot** cadrul în buffer, verifică **FCS-ul** și abia apoi transmite. Elimină cadrele eronate; necesar pentru analiza QoS și când porturile au viteze diferite.\n- **Cut-through (fast-forward)** — citește doar primii **6 octeți** (MAC destinație) și transmite imediat. Latență minimă, dar NU verifică FCS, deci propagă cadre eronate.\n- **Fragment-free** — compromisul: citește primii **64 de octeți** înainte să transmită, exact zona în care apar coliziunile.\n\nUn **switch L3** face în plus rutare pe baza adresei IP, implementată hardware.",
          "diagrama": null,
          "examen": "2013: principiul de funcționare al unui HUB și al unui SWITCH (+ CSMA/CD și cadrul 802.3); 2022: câte interogări ARP inițiază switch-ul ca să forwardeze un pachet IP — zero, e echipament de nivel 2 (vezi subiect_2022.md)",
          "faptaCheie": "Store-and-forward e singurul mod de comutare care verifică FCS; cut-through decide după doar 6 octeți citiți, iar fragment-free după 64.",
          "sursa": "LAN Course 2026.pdf p.6, 24–26, 46–51 / ethernet.md §6 / subiect_2022.md"
        },
        {
          "id": "switch-invatare",
          "titlu": "Cum învață switch-ul: tabela MAC",
          "tip": "terminal",
          "rezumat": "Switch-ul pornește cu tabela goală, învață adresele MAC sursă din cadrele primite și, când nu cunoaște destinația sau primește broadcast, face flooding pe toate porturile în afară de cel de intrare.",
          "detaliu": "Un switch face trei lucruri cu fiecare cadru: îl primește pe un port de intrare (ingress), caută **MAC-ul destinație** în tabela MAC/de comutare (numită **CAM** la Cisco) și îl transmite pe portul sau porturile de ieșire (egress). Tabela mapează **MAC → port** și e construită prin cinci operații:\n\n- **1. Learning** — tabela e **inițial goală**; switch-ul învață din adresa **MAC sursă** a fiecărui cadru recepționat. Poate învăța mai multe adrese pe același port, dar NU aceeași adresă pe porturi diferite.\n- **2. Aging** — fiecare intrare are un contor de timp (implicit ex. `480 s`), resetat când mai vine trafic de la acel MAC; la expirare intrarea dispare, ca tabela să urmeze schimbările de topologie.\n- **3. Flooding** — cadrul e trimis pe **toate porturile, cu excepția celui pe care a sosit**, în două situații: destinație necunoscută (unknown unicast) sau adresă destinație de tip broadcast. Implicit și multicast-ul se tratează la fel.\n- **4. Selective forwarding** — dacă MAC-ul destinație e în tabelă, cadrul pleacă doar pe portul corespunzător.\n- **5. Filtering** — nu se transmit: cadre pe portul de pe care au sosit, cadre invalide (erori) și cadre care încalcă cerințe de securitate (VLAN, adrese restricționate).\n\nExemplul dat la examen în 2018 și 2023: switch cu 4 porturi, tabelă goală. Cadrul 1 vine de la `11:22:33:44:55:66` pe portul 1, cadrul 2 de la `22:33:44:55:66:77` pe portul 3, ambele către `66:77:88:99:00:11`. Tabela ajunge să aibă exact cele două MAC-uri sursă (porturile 1 și 3), iar cadrul 2, cu destinație necunoscută, e **floodat pe porturile 1, 2 și 4** — toate în afară de 3.",
          "diagrama": "switch-learning",
          "examen": "2018 și 2023: conținutul tabelei CAM după două cadre și pe ce porturi se forwardează al doilea cadru — flooding pe toate porturile cu excepția portului 3 (vezi subiect_2023.md)",
          "faptaCheie": "Switch-ul învață din MAC-ul SURSĂ, dar comută după MAC-ul DESTINAȚIE — iar destinație necunoscută înseamnă flooding pe toate porturile, minus cel de intrare.",
          "sursa": "LAN Course 2026.pdf p.27–42 / ethernet.md §6 / subiect_2023.md"
        },
        {
          "id": "vlan-8021q",
          "titlu": "VLAN și eticheta 802.1Q",
          "tip": "npc",
          "rezumat": "VLAN-urile împart logic LAN-ul după structura organizației, nu după cabluri; pe trunk-uri, cadrele primesc un tag 802.1Q de 4 octeți cu VID pe 12 biți (VLAN 1–4094).",
          "detaliu": "Ideea VLAN: organizarea rețelei trebuie să reflecte **structura organizațională**, nu dispunerea fizică. Față de subrețelele fizice (infrastructură complexă, costuri ridicate), sub-rețelele virtuale aduc **securitate** (izolarea departamentelor) și **limitarea traficului inutil** — broadcast-urile (ARP, broadcast storm) rămân în interiorul VLAN-ului.\n\nReguli de bază:\n- toate stațiile din același VLAN trebuie să aibă IP/mască din **aceeași rețea**;\n- **port access** = aparține unui singur VLAN (spre stații); cadrele circulă pe el ca Ethernet 802.3 simplu;\n- **port trunk** = transportă trafic pentru mai multe VLAN-uri (legătură punct-la-punct între două porturi marcate trunk, de obicei switch–switch).\n\nCadrul Ethernet nu are câmp pentru VLAN, așa că pe trunk se inserează **tag-ul 802.1Q de 4 octeți** între MAC sursă și Lungime/Tip:\n- **TPID** = `0x8100` — identifică cadrul ca 802.1Q;\n- **TCI** = **PCP** (3 biți, prioritate), **DEI** (1 bit, drop la congestie), **VID** (12 biți) — identificatorul VLAN, valori utile **1–4094**.\n\nCu tag, cadrul crește la **68–1522 octeți** și **FCS-ul se recalculează**. VLAN-urile trebuie definite pe fiecare switch (tabela VLAN, fișierul `vlan.dat`).\n\nVLAN-uri speciale: **VLAN 1** e default-ul — singurul existent out-of-the-box, implicit și *nativ* și de *management*. **VLAN-ul nativ** transportă cadrele **nemarcate** de pe trunk și trebuie să fie același la ambele capete; din motive de securitate, management ≠ nativ și ambele ≠ 1.\n\nComunicarea **inter-VLAN** cere nivel 3: un router cu câte o interfață per VLAN, **router-on-a-stick** (o interfață fizică trunk + subinterfețe virtuale) sau un switch L3 cu interfețe SVI.",
          "diagrama": "vlan-tag",
          "examen": null,
          "faptaCheie": "Tag-ul 802.1Q are TPID fix 0x8100 și un VID de 12 biți — deci maximum 4094 de VLAN-uri utilizabile, iar cadrul crește la 68–1522 octeți.",
          "sursa": "LAN Course 2026.pdf p.52–76 / ethernet.md §8"
        },
        {
          "id": "protocolul-arp",
          "titlu": "ARP: de la IP la MAC",
          "tip": "cufar",
          "rezumat": "ARP află adresa MAC asociată unui IP: un Request în broadcast („cine are IP-ul X?\"), un Reply unicast de la țintă, iar rezultatul se ține în ARP cache; varianta Gratuitous ARP anunță propriul IP și detectează conflicte.",
          "detaliu": "Ca să trimiți un cadru Ethernet ai nevoie de MAC-ul destinației, dar tu știi doar IP-ul — aici intră **ARP** (Address Resolution Protocol). Detaliu fin: ARP **nu are antet IP**, e încapsulat direct în cadrul Ethernet cu `EtherType 0x0806` (IP e `0x0800`), deci e considerat protocol de nivel 2.\n\nFluxul normal:\n- 1. Vreau să trimit către IP-ul X, dar nu-i știu MAC-ul.\n- 2. Trimit **ARP Request** în **broadcast** (`FF:FF:FF:FF:FF:FF`): „Cine are IP-ul X? Spune-mi MAC-ul.\"\n- 3. Doar hostul cu IP-ul X răspunde cu **ARP Reply**, unicast.\n- 4. Salvez maparea IP → MAC în **ARP cache** — care are timeout, deci intrările expiră.\n\nNu confunda cele două tabele: **ARP cache** stă pe host/router și mapează IP → MAC (populat prin ARP); **tabela CAM** stă pe switch și mapează MAC → port (populată prin source learning, nu prin ARP). Switch-ul nu se uită la IP-uri deloc.\n\n**Gratuitous ARP** e ARP-ul „pe dos\": stația întreabă de **propriul IP**, cu `Sender IP = Target IP`, în broadcast, și **nu așteaptă răspuns** — anunță, nu cere. Trei scenarii de utilizare:\n- 1. **anunțare în rețea** — toți își actualizează ARP cache-ul cu maparea ta;\n- 2. **detectarea conflictului de IP** — dacă totuși primești un reply, altcineva folosește deja IP-ul tău;\n- 3. **failover / IP virtual** (VRRP, clustere) — când IP-ul se mută pe alt echipament, noul deținător trimite Gratuitous ARP ca traficul să se redirecteze spre noul MAC.\n\nPe scurt: ARP = „cine ești tu?\", Gratuitous ARP = „eu sunt aici, actualizați-vă tabelele!\".",
          "diagrama": "arp-flow",
          "examen": "2024: funcționarea Gratuitous ARP + 2 scenarii de utilizare (vezi subiect_2024.md); 2022: detectarea conflictului de IP prin Gratuitous ARP; 2016: intrările din tabelele ARP într-o rețea cu router; 2010, 2013, 2014, 2018, 2024: scenarii complete ARP + DNS + TCP la accesarea unei pagini web",
          "faptaCheie": "La Gratuitous ARP, Sender IP = Target IP = propriul IP și nu se așteaptă răspuns — dacă totuși vine un reply, ai conflict de adresă IP.",
          "sursa": "arp.md / subiect_2024.md §3 / subiect_2022.md"
        }
      ],
      "recap": [
        {
          "intrebare": "Un switch primește un cadru cu o adresă MAC destinație care nu apare în tabela lui. Ce face cu el?",
          "variante": [
            "Îl transmite pe toate porturile, cu excepția celui pe care a sosit (flooding)",
            "Îl aruncă și inițiază o interogare ARP pentru a afla portul",
            "Îl trimite înapoi pe portul sursă ca să anunțe expeditorul",
            "Îl păstrează în buffer până când destinația trimite un cadru"
          ],
          "corect": 0,
          "explicatie": "Destinație necunoscută (unknown unicast) înseamnă flooding: cadrul pleacă pe toate porturile în afară de cel de intrare. Switch-ul nu face niciodată ARP — e echipament de nivel 2."
        },
        {
          "intrebare": "De ce are cadrul Ethernet o dimensiune minimă de 64 de octeți?",
          "variante": [
            "Ca să încapă întotdeauna un antet IP complet",
            "Ca o coliziune să poată fi detectată înainte ca stația să termine transmisia (slot time = 512 biți)",
            "Ca switch-ul să poată verifica FCS-ul în modul cut-through"
          ],
          "corect": 1,
          "explicatie": "În CSMA/CD, slot time-ul (512 biți = 64 octeți la 10/100 Mbps) e timpul maxim de propagare dus-întors; un cadru mai scurt s-ar putea termina înainte ca stația să afle de coliziune."
        },
        {
          "intrebare": "Ce identifică câmpul VID din tag-ul 802.1Q și pe câți biți este reprezentat?",
          "variante": [
            "Prioritatea traficului, pe 3 biți",
            "Tipul protocolului de nivel 3, pe 16 biți",
            "VLAN-ul căruia îi aparține cadrul, pe 12 biți (valori utile 1–4094)"
          ],
          "corect": 2,
          "explicatie": "În TCI, VID-ul are 12 biți și identifică VLAN-ul (1–4094); prioritatea e câmpul PCP (3 biți), iar TPID-ul 0x8100 marchează cadrul ca 802.1Q."
        }
      ]
    },
    {
      "id": "ip",
      "nume": "Munții IP",
      "icon": "⛰️",
      "sursa": "ip.pdf / ipv4_header_explained.md / rezolvări 2022–2024",
      "descriere": "Urci pe creasta nivelului rețea: antetul IPv4 câmp cu câmp, clasele de adrese și CIDR, adresele speciale și private, subnetizarea VLSM, fragmentarea și duo-ul TTL–Protocol. Aici se câștigă punctele sigure de la examen.",
      "puncte": [
        {
          "id": "antet-ipv4",
          "titlu": "Antetul IPv4, câmp cu câmp",
          "tip": "terminal",
          "rezumat": "Antetul IPv4 (RFC 791) are 20 de octeți ficși plus până la 40 de octeți de opțiuni, organizați pe rânduri de 32 de biți — fiecare câmp are un rol precis.",
          "detaliu": "Antetul IPv4 (RFC 791) e organizat pe rânduri de 32 de biți. Partea fixă are **20 de octeți**, iar cu Options poate crește până la **60 de octeți**.\n\n- **Version** (4 biți) — versiunea protocolului: `4` pentru IPv4.\n- **Header Length / IHL** (4 biți) — lungimea antetului în cuvinte de 32 de biți: minim `5`, maxim `15` (adică 20–60 de octeți).\n- **Type of Service** (8 biți) — calitatea serviciului; în semnificația veche (RFC 1349) biți de precedență + low delay / high throughput / reliability, în cea nouă `DSCP` (RFC 2474) + `ECN` (RFC 3168).\n- **Total Length** (16 biți) — antet + date, în octeți; maxim `65.535`.\n- **Identification** (16 biți) — număr unic setat de sursă; toate fragmentele aceluiași pachet au același ID.\n- **Flags** (3 biți) — un bit rezervat (0), `DF` (Don't Fragment), `MF` (More Fragments).\n- **Fragment Offset** (13 biți) — poziția fragmentului în datagrama originală, în unități de 8 octeți.\n- **TTL** (8 biți) — limita numărului de hopuri înainte ca pachetul să fie abandonat.\n- **Protocol** (8 biți) — cui livrezi datele: `1`=ICMP, `2`=IGMP, `6`=TCP, `17`=UDP.\n- **Header Checksum** (16 biți) — detecția erorilor din antet.\n- **Source IP / Destination IP** (câte 32 de biți) — expeditorul și destinatarul.\n- **Options + Padding** (0–40 de octeți) — de exemplu timestamp și source routing.\n\nLa examen se cere aproape mereu schema plus semnificația fiecărui câmp — învață dimensiunile în biți, ele fac diferența la punctaj.",
          "diagrama": "ipv4-header",
          "examen": "2004, 2005, 2009, 2010: schema antetului IPv4 și semnificația fiecărui câmp; 2014 și 2021: extragerea câmpurilor (MAC, IP, TTL, Protocol) dintr-un dump hexazecimal al unui pachet capturat.",
          "faptaCheie": "Antetul IPv4 are între 20 și 60 de octeți: IHL numără cuvinte de 32 de biți, de la 5 la 15.",
          "sursa": "ip.pdf p.21–24 / ipv4_header_explained.md"
        },
        {
          "id": "adresare-clase-cidr",
          "titlu": "Adresarea IPv4: clase, notație, CIDR",
          "tip": "npc",
          "rezumat": "O adresă IPv4 are 32 de biți: prefix de rețea + număr de host. Până în 1993 prefixul era dat de clasa A–E, azi îl dă masca, în notația CIDR.",
          "detaliu": "O adresă IPv4 e o valoare pe **32 de biți** cu structura `[Network Prefix][Host Number]`, scrisă în **notație zecimală cu punct**: `11000001 11100111 00010101 00001010` = `193.231.21.10`. Fiecare interfață de rețea a unui host sau router trebuie să aibă o adresă IP unică.\n\nÎnainte de 1993, prefixul era definit implicit de clasă (**Classful Addressing**):\n\n- **Clasa A** — începe cu bitul `0`, primul octet `0–127`, prefix de 8 biți: 2^7−2 = 126 rețele, fiecare cu 16.777.214 adrese.\n- **Clasa B** — începe cu `10`, primul octet `128–191`, prefix de 16 biți: 16.384 rețele cu câte 65.534 adrese.\n- **Clasa C** — începe cu `110`, primul octet `192–223`, prefix de 24 de biți: 2.097.152 rețele cu câte 254 adrese.\n- **Clasa D** — începe cu `1110`: adrese de **multicast**.\n- **Clasa E** — începe cu `11110`: rezervată pentru viitor.\n\nProblema claselor: A și B erau deseori prea mari, C prea mici — risipă de adrese, iar tabelele de rutare din backbone au explodat. Din 1993 se folosește **CIDR** (Classless Inter-Domain Routing): prefixul e indicat explicit de mască, de exemplu `193.231.21.10/24` cu masca `255.255.255.0`, iar rutele se pot agrega ca să scadă numărul de intrări din tabelele de rutare.\n\nÎn rețelele moderne clasele nu mai sunt relevante — dar la examen pică des «în ce clasă e adresa?»: te uiți doar la primul octet.",
          "diagrama": "adresare-clase",
          "examen": "2004, 2005, 2009, 2010: clasele A–E; 2012 și 2021: clasa adreselor 200.58.20.165 (C), 191.10.70.130 (B), 128.167.23.20 (B), 16.196.128.50 (A); 2019: clasa lui 107.85.20.3 și broadcastul subrețelei cu masca 255.255.255.240.",
          "faptaCheie": "Clasa se citește din primul octet: 0–127 = A, 128–191 = B, 192–223 = C, apoi D (multicast) și E (rezervată).",
          "sursa": "ip.pdf p.10, 12–14, 19"
        },
        {
          "id": "adrese-speciale-private",
          "titlu": "Adrese rezervate și adrese private",
          "tip": "cufar",
          "rezumat": "Host tot 0 = rețeaua, host tot 1 = broadcast, 127.x = loopback, iar trei blocuri RFC 1918 sunt private și nu se rutează în Internet.",
          "detaliu": "Nu orice combinație de biți e o adresă «normală» de host. Cursul listează adresele rezervate:\n\n- `0.0.0.0` (totul pe 0) — «this computer», folosită la bootstrap.\n- prefix de rețea + host tot 0 — identifică **rețeaua** însăși.\n- prefix de rețea + host tot 1 — **directed broadcast**: broadcast în rețeaua specificată (ex. `172.20.255.255/16` pentru toate calculatoarele din 172.20.0.0/16).\n- `255.255.255.255` (totul pe 1) — **limited broadcast**, către toate calculatoarele din subrețeaua locală.\n- `127.x.x.x` — **loopback**, pentru testare.\n\nRegulă de reținut: o adresă de broadcast nu poate să apară ca adresă sursă!\n\nPentru a economisi adrese, RFC 1918 rezervă trei spații pentru **rețele private**:\n\n- `10.0.0.0 .. 10.255.255.255`\n- `172.16.0.0 .. 172.31.255.255`\n- `192.168.0.0 .. 192.168.255.255`\n\nAdresele private **nu pot fi folosite în Internet** — nu sunt rutate. Calculatoarele din rețeaua internă (Intranet) le folosesc liniștite, iar când vor să iasă în Internet, adresa privată trebuie translatată într-o adresă publică prin **NAT** (Network Address Translation), realizat pe routerul care asigură conectarea la Internet. NAT modifică antetul pachetului IP original (schimbă adresele), deci suma de control trebuie recalculată.\n\nAșa se explică de ce acasă toți avem 192.168.x.x și totuși nu ne călcăm pe adrese: fiecare rețea privată e o lume separată în spatele propriului NAT.",
          "diagrama": null,
          "examen": "2009: adresele IP rezervate și adresele IP private, ca parte a modului de adresare; 2010: clase, adrese rezervate, adrese private și măști de subrețea în același subiect.",
          "faptaCheie": "Blocurile private RFC 1918 sunt exact trei: 10.0.0.0–10.255.255.255, 172.16.0.0–172.31.255.255 și 192.168.0.0–192.168.255.255.",
          "sursa": "ip.pdf p.11, 15, 40, 73, 75"
        },
        {
          "id": "subnetizare-vlsm",
          "titlu": "Subnetizare și VLSM",
          "tip": "totem",
          "rezumat": "Împarți o rețea în subrețele extinzând prefixul spre dreapta; cu VLSM alegi pentru fiecare subrețea cel mai mic m cu 2^m − 2 ≥ numărul de hosturi.",
          "detaliu": "O organizație are de regulă mai multe rețele gestionate independent. În loc să ceri câte o clasă de adrese pentru fiecare (risipă), împarți rețeaua existentă în subrețele: `IP = [Network Prefix][Subnet Number][Host Number]`. **Masca de subrețea** e deplasarea la dreapta a măștii de rețea (extinderea prefixului), iar adresele subrețelelor sunt gestionate local.\n\nExemplul din curs: `141.14.0.0/16` împărțită în 4 subrețele `/18`: `141.14.0.0/18`, `141.14.64.0/18`, `141.14.128.0/18` și `141.14.192.0/18`.\n\nRețelele actuale folosesc **VLSM** (Variable Length Subnet Mask): măști de lungimi diferite, potrivite fiecărei rețele — un subnet nu mai e cu nimic diferit de o rețea, dar pentru fiecare adresă trebuie precizată masca. Algoritmul din rezolvările de examen:\n\n- pentru fiecare subrețea cauți cel mai mic `m` cu `2^m − 2 ≥ nr. hosturi` (m = biți de host, masca devine /(32−m));\n- ordonezi subrețelele descrescător după mărime;\n- aloci blocurile consecutiv din spațiul dat.\n\nExemplu rezolvat (subiect 2022 și 2024): din `13.2.80.0/21`, X are 1000 de hosturi → `2^10−2 = 1022` → `/22`: rețea `13.2.80.0/22`, mască `255.255.252.0`, prima adresă `13.2.80.1`, ultima `13.2.83.254`, broadcast `13.2.83.255`. Y (500 hosturi) → `2^9−2 = 510` → `13.2.84.0/23`, iar Z → `13.2.86.0/23`, ambele cu masca `255.255.254.0`.\n\nSubnetizarea e cel mai recurent tip de problemă din examene — exersează calculul până devine reflex.",
          "diagrama": "subnet-schema",
          "examen": "Aproape anual: 2012/2021 (193.231.21.0 pentru 4 departamente: /25, /26, /27, /27), 2013/2020 (192.168.10.0/24 → 7 subrețele), 2023 (192.168.10.0/24 → /25, /26, /27, /30), 2022/2024 (13.2.80.0/21 → X /22, Y și Z /23 — vezi rezolvările scanate), 2021: masca minimă pentru 60 de calculatoare = /26.",
          "faptaCheie": "Formula de aur: cel mai mic m cu 2^m − 2 ≥ numărul de hosturi îți dă masca /(32−m), iar subrețelele se alocă în ordine descrescătoare.",
          "sursa": "ip.pdf p.16–19 / rezolvare_5_6_7.jpeg (2022), schema_adresare_2024.jpg, rezolvare_2_3.jpg (2023)"
        },
        {
          "id": "fragmentare-campuri",
          "titlu": "Fragmentarea: Identification, DF/MF, Offset",
          "tip": "terminal",
          "rezumat": "Trei câmpuri controlează fragmentarea: Identification grupează fragmentele, flagurile DF/MF o interzic sau anunță continuarea, iar Fragment Offset dă poziția în unități de 8 octeți.",
          "detaliu": "Pachetele pot străbate mai multe subrețele, fiecare cu propria dimensiune maximă a cadrelor (**MTU**) — deci un router poate fi nevoit să **fragmenteze** pachetul pe traseu, iar **reasamblarea se face doar la destinație**.\n\nTrei câmpuri din antetul IPv4 controlează fragmentarea:\n\n- **Identification** (16 biți) — număr unic setat de calculatorul sursă; **toate fragmentele aceluiași pachet au același ID**, așa le grupează destinația.\n- **Flags** (3 biți) — primul bit e rezervat (mereu 0); `DF` (Don't Fragment): 0 = fragmentarea e permisă, 1 = nu e permisă — un pachet prea mare cu DF=1 e aruncat și sursa primește ICMP «Fragmentation Needed and DF Bit Set» (tip 3, cod 4); `MF` (More Fragments): 1 = mai urmează fragmente, 0 = ultimul fragment.\n- **Fragment Offset** (13 biți) — poziția fragmentului în datagrama originală, măsurată în **unități de 8 octeți**; primul fragment are offset 0.\n\nExemplul din curs: o datagramă de 2400 de octeți (antet 20) trece printr-un router cu MTU 1000 și devine 3 fragmente cu același ID `0xa428`: fragmentul 1 — lungime totală 996, offset 0, MF=1; fragmentul 2 — 996, offset 122, MF=1; fragmentul 3 — 448, offset 244, MF=0. Verificare: 976 de octeți de date / 8 = 122, exact offsetul fragmentului următor.\n\nLa destinație, reasamblarea grupează fragmentele după tuplul (IP sursă, IP destinație, Protocol, Identification) și le ordonează după Fragment Offset; MF=0 marchează finalul.",
          "diagrama": "fragmentare",
          "examen": "2024: câmpurile din antetul IPv4 folosite pentru controlul fragmentării — Identification, Flags DF/MF, Fragment Offset (vezi subiect_2024.md); 2023: aceeași cerință (vezi rezolvare_2_3.jpg); 2004, 2005, 2009: fragmentarea explicată în cadrul subiectului despre antetul IP.",
          "faptaCheie": "Fragment Offset se măsoară în unități de 8 octeți, iar MF=0 apare doar pe ultimul fragment.",
          "sursa": "ip.pdf p.23, 25–27 / subiect_2024.md"
        },
        {
          "id": "mtu-calcul-fragmente",
          "titlu": "MTU și calculul fragmentelor",
          "tip": "npc",
          "rezumat": "Ethernet are MTU 1500 de octeți; când pachetul depășește MTU-ul, îl spargi în fragmente cu antet propriu de 20 de octeți și date multiplu de 8.",
          "detaliu": "**MTU** (Maximum Transmission Unit) e dimensiunea maximă a cadrelor dintr-o subrețea — și nu se cunoaște în avans pe traseu! Valorile din curs:\n\n- **Ethernet: 1500**\n- FDDI: 4352\n- X.25: 576\n- Frame Relay: 1600\n- PPP: 296..1500\n\nAtenție la subiectul din 2022: MTU-ul Ethernet de `1500` de octeți **nu include** antetul de 14 octeți și trailerul FCS de 4 octeți al cadrului — cadrul Ethernet întreg are 1518 octeți.\n\nCum calculezi fragmentele: fiecare fragment e un pachet IP complet, cu **propriul antet de 20 de octeți**, deci într-un MTU de 1000 încap cel mult 980 de octeți de date — dar datele fiecărui fragment (în afară de ultimul) trebuie să fie **multiplu de 8**, ca Fragment Offset să iasă număr întreg. De aceea, în exemplul din curs fragmentele au câte 976 de octeți de date, nu 980.\n\nProblema de examen din 2020: A trimite 200 de pachete IP de 1000 de octeți (20 antet + 980 date) printr-un router către o rețea cu MTU 500. Fiecare pachet devine 3 fragmente — două de câte 500 de octeți (20 antet + 480 date, iar 480 e multiplu de 8) și unul de 40 de octeți (20 antet + 20 date rămase) — deci la B ajung în total `200 × 3 = 600` de fragmente.\n\nRețeta e mereu aceeași: scazi antetul din MTU, rotunjești datele în jos la multiplu de 8, împarți și nu uiți că fiecare fragment își ia propriul antet.",
          "diagrama": null,
          "examen": "2022: valoarea MTU pentru rețelele Ethernet — 1500 de octeți (vezi rezolvare_1_2_4.jpeg); 2020: 200 de pachete de 1000 de octeți printr-un router spre MTU 500 → 600 de fragmente de 500, 500 și 40 de octeți.",
          "faptaCheie": "MTU-ul Ethernet e 1500 de octeți și nu include antetul de 14 și trailerul de 4 — cadrul complet are 1518 octeți.",
          "sursa": "ip.pdf p.25–27 / rezolvare_1_2_4.jpeg (2022)"
        },
        {
          "id": "ttl-protocol",
          "titlu": "TTL și Protocol: paznicii pachetului",
          "tip": "cufar",
          "rezumat": "TTL limitează numărul de hopuri și moare cu un ICMP Time Exceeded — baza traceroute-ului; Protocol spune cui livrezi datele: 1=ICMP, 6=TCP, 17=UDP.",
          "detaliu": "**TTL (Time To Live)** — 8 biți — e limita superioară a numărului de hopuri prin care poate trece pachetul înainte de a fi abandonat; rolul lui e să prevină buclele din rețea. Când TTL ajunge la 0, routerul aruncă pachetul și trimite sursei mesajul ICMP **Time Exceeded** (tip 11, cod 0).\n\nPe exact acest mecanism se bazează `traceroute` (Unix) / `tracert` (Windows): transmite pachete UDP cu TTL crescător (1, 2, 3, …) — fiecare router intermediar la care TTL expiră răspunde cu «time exceeded», dezvăluindu-și adresa. Pachetele UDP merg către un port destinație neutilizat, așa că atunci când ajung la destinație aceasta răspunde cu «port unreachable» și traseul e complet. Valoarea RTT se calculează pentru fiecare pachet în parte.\n\n**Protocol** — 8 biți — indică protocolul de nivel superior către care trebuie livrat pachetul:\n\n- `0` — Reserved\n- `1` — ICMP\n- `2` — IGMP\n- `6` — TCP\n- `17` — UDP\n\nCele două câmpuri apar des în problemele de analiză: în dump-ul hexazecimal din 2014, TTL era `128` și Protocol `1`, deci payload-ul era ICMP. Iar în problemele de rutare TTL scade cu 1 la fiecare router traversat: plecat cu 128 și trecut prin două routere ajunge `126` (subiect 2020), printr-unul singur ajunge `127` (subiect 2015). Dacă vezi un TTL «ciudat» într-o captură, numeri routerele din drum.",
          "diagrama": null,
          "examen": "2014: TTL=128 și Protocol=1 (ICMP) citite din dump-ul Wireshark; 2015: TTL la destinație 127 după un router; 2020: TTL 126 după două routere; 2021: explicarea traceroute (TTL incremental + ICMP Time Exceeded) și payload ICMP identificat în dump.",
          "faptaCheie": "Protocol: 1 = ICMP, 6 = TCP, 17 = UDP — iar la TTL 0 routerul răspunde cu ICMP Time Exceeded, tip 11.",
          "sursa": "ip.pdf p.24, 49, 51–53"
        }
      ],
      "recap": [
        {
          "intrebare": "Câți octeți poate avea antetul IPv4?",
          "variante": [
            "Între 20 și 60 de octeți",
            "Fix 20 de octeți",
            "Între 20 și 65.535 de octeți"
          ],
          "corect": 0,
          "explicatie": "IHL exprimă lungimea antetului în cuvinte de 32 de biți, între 5 și 15 — adică 20 de octeți ficși plus maximum 40 de octeți de opțiuni; 65.535 e maximul câmpului Total Length (antet + date)."
        },
        {
          "intrebare": "În ce unități se măsoară câmpul Fragment Offset din antetul IPv4?",
          "variante": [
            "Octeți",
            "Unități de 8 octeți",
            "Cuvinte de 32 de biți",
            "Biți"
          ],
          "corect": 1,
          "explicatie": "Offsetul pe 13 biți dă poziția fragmentului în datagrama originală în unități de 8 octeți — de aceea datele fragmentelor (în afară de ultimul) trebuie să fie multiplu de 8."
        },
        {
          "intrebare": "Din ce clasă face parte adresa IP 191.10.70.130?",
          "variante": [
            "Clasa A",
            "Clasa B",
            "Clasa C"
          ],
          "corect": 1,
          "explicatie": "Primul octet 191 e în intervalul 128–191, deci clasa B (adresa începe cu biții 10) — exact răspunsul din baremele 2012 și 2021."
        }
      ]
    },
    {
      "id": "routing",
      "nume": "Răscrucea Routing",
      "icon": "🚦",
      "sursa": "routing.pdf / subiect_2022.md (rezolvare_8.jpeg)",
      "descriere": "Aici înveți cum decide un router pe unde trimite pachetele: rutare directă vs indirectă, tabela de rutare și cum se caută în ea (longest prefix match), ruta implicită și protocoalele care umplu tabela — de la rute statice la RIP și OSPF.",
      "puncte": [
        {
          "id": "rutare-directa-vs-indirecta",
          "titlu": "Rutare directă vs indirectă",
          "tip": "npc",
          "rezumat": "Dacă destinația e într-o rețea direct conectată, pachetul se livrează direct pe interfață; altfel e predat unui next hop (gateway), iar în tabelă adresa lui apare după cuvântul „via”.",
          "detaliu": "Când un router (sau chiar PC-ul tău) are de trimis un pachet, prima întrebare e simplă: **destinația e într-o rețea la care sunt conectat direct?**\n\n- Dacă da, avem **rutare directă**: pachetul e livrat direct pe interfața respectivă, fără intermediari. În tabela de rutare aceste rețele apar cu codul `C` (connected), de exemplu `C 192.168.1.0 is directly connected, Serial0/0/0`, și au distanța administrativă `0` — sursa cu cea mai mare încredere posibilă.\n- Dacă nu, avem **rutare indirectă**: pachetul e predat unui **next hop** (următorul router de pe traseu), a cărui adresă IP apare în tabelă după cuvântul `via`, de exemplu `via 192.168.1.1`.\n\nPartea care pică des la examen e ce se schimbă și ce NU se schimbă pe drum:\n\n- adresele **IP sursă și destinație rămân neschimbate** cap-la-cap;\n- adresa **MAC destinație** a cadrului e mereu a următorului hop (gateway-ul), deci cadrul se re-încapsulează la fiecare router.\n\nExemplu clasic de subiect (2024): laptopul cu GW 192.168.0.1 trimite un TCP SYN către serverul www.mta.ro (213.177.4.168) — cadrul care pleacă din laptop are ca MAC destinație routerul-gateway (11:11:11:11:11:11), nu serverul, dar IP-ul destinație rămâne 213.177.4.168, al serverului final.",
          "diagrama": null,
          "examen": "2024 (cerința 7): completarea cadrelor pe traseul laptop → router → www.mta.ro — la TCP SYN, MAC destinație = 11:11:11:11:11:11 (routerul-gateway), dar IP sursă/destinație rămân 192.168.0.7 → 213.177.4.168 (vezi cerinta_7.png + rezolvare_7.jpg din subiect_2024.md).",
          "faptaCheie": "Pe traseu, IP-urile sursă/destinație nu se schimbă niciodată; MAC-ul destinație al cadrului e mereu al următorului hop (gateway-ul).",
          "sursa": "routing.pdf p.9, 11, 41 + subiect_2024.md (cerinta_7.png, rezolvare_7.jpg)"
        },
        {
          "id": "tabela-de-rutare",
          "titlu": "Tabela de rutare: coloane și citire",
          "tip": "terminal",
          "rezumat": "O intrare din tabelă are: codul sursei (C/S/R/O...), rețeaua destinație cu prefix, [distanța administrativă/metrica], next hop-ul după „via” și interfața de ieșire.",
          "detaliu": "Tabela de rutare e GPS-ul routerului: pentru fiecare destinație cunoscută spune pe unde se iese. O vezi cu comanda `show ip route`, iar o intrare tipică arată așa:\n\n`R 0.0.0.0/0 [120/1] via 192.168.1.1, 00:00:05, Serial0/0/0`\n\nColoanele, pe rând:\n\n- **Codul sursei** — de unde a fost învățată ruta: `C` direct conectat, `S` static, `R` RIP, `O` OSPF, `D` EIGRP, `B` BGP, `i` IS-IS.\n- **Rețeaua destinație + prefixul** — ex. `0.0.0.0/0` sau `192.168.1.0/30`.\n- **[DA/metrică]** — prima valoare din paranteze e **distanța administrativă**, a doua e **metrica**.\n- **Next hop** — după `via`, adresa IP a routerului următor (succesorul).\n- **Interfața de ieșire** — ex. `Serial0/0/0`.\n\n**Distanța administrativă (DA)** clasifică sursele de rute când aceeași rețea e învățată pe mai multe căi: direct conectat `0`, static `1`, rută sumară EIGRP `5`, BGP extern `20`, EIGRP intern `90`, IGRP `100`, OSPF `110`, IS-IS `115`, RIP `120`, EIGRP extern `170`, BGP intern `200`. Mai mic = mai de încredere.\n\n**Metrica** fixează costul până la rețeaua destinație în interiorul aceluiași protocol: RIP folosește **hop count** (numărul de treceri prin noduri), OSPF și EIGRP folosesc **bandwidth**, iar EIGRP mai poate lua în calcul load, delay și reliability.\n\nLinia `Gateway of last resort is 192.168.1.1 to network 0.0.0.0` îți arată ieșirea de rezervă folosită când nimic altceva nu se potrivește.",
          "diagrama": "routing-tabel",
          "examen": null,
          "faptaCheie": "Într-o intrare ca „R 0.0.0.0/0 [120/1] via 192.168.1.1”, 120 e distanța administrativă și 1 e metrica.",
          "sursa": "routing.pdf p.9–11"
        },
        {
          "id": "longest-prefix-match-si-ruta-implicita",
          "titlu": "Longest prefix match și ruta implicită",
          "tip": "cufar",
          "rezumat": "Dintre toate intrările care se potrivesc cu destinația, routerul o alege pe cea cu prefixul cel mai lung; ruta implicită 0.0.0.0/0 se potrivește cu orice, dar pierde în fața oricărei rute mai specifice.",
          "detaliu": "Cum caută routerul în tabelă? Nu ia prima potrivire, ci pe **cea mai specifică**: dintre toate intrările al căror prefix acoperă adresa destinație, câștigă cea cu **cel mai lung prefix** (longest prefix match).\n\nIa exemplul din examenul 2022 — tabela avea prefixe suprapuse:\n\n- `128.8.16.0/20` → interfața 1 (acoperă 128.8.16.0 – 128.8.31.255)\n- `128.8.24.0/21` → interfața 2 (acoperă 128.8.24.0 – 128.8.31.255)\n- `128.8.128.0/24` → interfața 3 (acoperă 128.8.128.0 – 128.8.128.255)\n- `128.8.128.0/28` → interfața 4 (acoperă doar 128.8.128.0 – 128.8.128.15)\n- `Default` → interfața 5\n\nCum se judecă:\n\n- `128.8.128.5` se potrivește și cu /24 și cu /28 → câștigă **/28**, deci interfața 4.\n- `128.8.128.252` se potrivește cu /24, dar NU cu /28 (care merge doar până la .15) → interfața 3.\n- `128.8.25.223` se potrivește și cu /20 și cu /21 → câștigă **/21**, interfața 2.\n\n**Ruta implicită** e cazul-limită: `0.0.0.0/0` are prefix de lungime zero, deci se potrivește cu ORICE destinație, dar pierde în fața oricărei rute mai specifice — se folosește doar când nimic altceva nu se potrivește. În `show ip route` apare ca „Gateway of last resort”, iar în practică e ruta către Internet prin routerul ISP-ului. În RIP o poți distribui automat celorlalte routere cu comanda `default-information originate`.",
          "diagrama": null,
          "examen": "2019: tabelă de rutare cu 6 intrări CIDR — interfața de ieșire pentru 4 destinații (longest prefix match); 2022: tabelă cu prefixe suprapuse (128.8.16.0/20, /21, /24, /28, Default) — ex. 128.8.128.5 → /28 (int. 4), 128.8.128.252 → /24 (int. 3), 128.8.25.223 → /21 (int. 2) (vezi rezolvare_8.jpeg din subiect_2022.md).",
          "faptaCheie": "128.8.128.5 se potrivește și cu /24 și cu /28, dar merge pe /28 — prefixul mai lung bate întotdeauna.",
          "sursa": "routing.pdf p.11, 20 / subiect_2022.md (rezolvare_8.jpeg)"
        },
        {
          "id": "rutare-statica-vs-dinamica",
          "titlu": "Rutare statică vs dinamică",
          "tip": "totem",
          "rezumat": "Rutele statice le scrie administratorul de mână (DA 1, nu se adaptează), iar cele dinamice le învață routerele singure printr-un protocol de rutare, cu prețul consumului de resurse.",
          "detaliu": "Tabela de rutare se umple pe două căi.\n\n**Rutarea statică**: administratorul scrie rutele de mână. Apar cu codul `S` și au distanța administrativă `1` — imediat după rețelele direct conectate, deci bat orice protocol dinamic. Problema? Nu se adaptează: la orice schimbare de topologie trebuie modificate manual, iar o rută statică incorect configurată e una dintre cauzele clasice de **bucle de rutare** (pachetul e transmis continuu printr-o serie de routere fără să ajungă vreodată la rețeaua destinație).\n\n**Rutarea dinamică**: routerele rulează un **protocol de rutare** — un set de procese, algoritmi și mesaje folosite să schimbe informații de rutare și să populeze tabelele. Scopurile lui:\n\n- descoperirea rețelelor remote;\n- menținerea la zi a informațiilor din tabelele de rutare;\n- alegerea celor mai bune rute către rețelele destinație;\n- alegerea unei noi rute optime dacă cea actuală devine indisponibilă.\n\nAvantaje: simplifică munca administratorului, schimbările de topologie sunt anunțate imediat, probabilitate scăzută de erori, scalabilitate. Dezavantaje: consumă resursele sistemului (CPU, RAM, bandwidth) și cer cunoștințe mai complexe de configurare.\n\nConceptul-cheie e **convergența**: momentul în care toate tabelele de rutare au informații complete și exacte despre rețea. Rețeaua e complet funcțională DOAR când e convergentă, iar timpul de convergență diferă între protocoale (RIP — încet; EIGRP, OSPF, IS-IS — rapid).\n\nCele două lumi se pot combina: cu `redistribute static` publici o rută statică într-un protocol dinamic, ca să o afle și celelalte routere.",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "Ruta statică are distanța administrativă 1 — bate orice protocol dinamic (OSPF 110, RIP 120); doar rețelele direct conectate (0) stau mai sus.",
          "sursa": "routing.pdf p.2–4, 9, 12, 25"
        },
        {
          "id": "distance-vector-vs-link-state",
          "titlu": "Distance vector vs link-state: RIP și OSPF",
          "tip": "terminal",
          "rezumat": "Protocoalele distance vector (RIP) anunță rute ca distanță + direcție cu Bellman-Ford, fără să cunoască topologia; cele link-state (OSPF) au harta întregii rețele și rulează Dijkstra.",
          "detaliu": "Protocoalele de rutare dinamice se împart întâi după teritoriu: **IGP** (Interior Gateway Protocols) rulează în interiorul unui domeniu de rutare / Autonomous System, iar **EGP** (Exterior Gateway Protocols) leagă domenii diferite — aici **BGP** e singurul și e cel utilizat de Internet.\n\nIGP-urile vin în două filozofii:\n\n**Distance vector** (RIPv1, RIPv2, IGRP, EIGRP):\n- anunță rutele ca vectori de distanță (metrica) și direcție (next hop sau interfața de ieșire);\n- folosesc algoritmul **Bellman-Ford**;\n- nu cunosc topologia întregii rețele — utile în rețele mici.\n\n**Link-state** (OSPF, IS-IS):\n- conțin informații despre topologia întregii rețele;\n- nu trimit update-uri periodice (doar la modificări în rețea);\n- utile în rețele mari, complexe, ierarhizate.\n\nStarul DV e **RIP**: metrică hop count cu maxim **16 = unreachable** (mecanismul count-to-infinity), update-uri periodice la fiecare **30 de secunde**, mesaje încapsulate în UDP pe portul **520**, DA 120. RIPv1 e classful (nu trimite masca, fără VLSM/CIDR, update-uri pe broadcast), RIPv2 e classless (trimite masca, suportă VLSM și CIDR, multicast pe `224.0.0.9`, autentifică update-urile).\n\nStarul LS e **OSPF** (RFC 2328): fiecare router are vedere completă asupra topologiei, rulează algoritmul **Dijkstra** (Shortest Path First) peste tabela de link-state, folosește mesaje **LSA** trimise pe multicast `224.0.0.5` și `224.0.0.6`, are DA 110, cost bazat pe bandwidth, triggered updates și timp de convergență minim; scalează prin împărțirea AS-ului în **arii**.\n\nDe reținut și comparația din curs: la viteză de convergență și scalabilitate, OSPF/IS-IS/EIGRP stau la „rapid/mare”, RIP la „încet/mică” — prețul fiind consumul mai mare de resurse și configurarea mai complexă.",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "RIP numără hopuri și declară destinația unreachable la 16; OSPF rulează Dijkstra pe harta completă a topologiei și are DA 110 față de 120 la RIP.",
          "sursa": "routing.pdf p.5–8, 15–22, 46–48, 55, 60"
        }
      ],
      "recap": [
        {
          "intrebare": "Destinația 128.8.128.5 se potrivește și cu intrarea 128.8.128.0/24, și cu 128.8.128.0/28. Pe care o alege routerul?",
          "variante": [
            "Pe /28 — câștigă cel mai lung prefix",
            "Pe /24 — e prima intrare din tabelă",
            "Pe ruta Default — la prefixe suprapuse",
            "Pe amândouă, împărțind traficul"
          ],
          "corect": 0,
          "explicatie": "Regula e longest prefix match: dintre toate intrările care se potrivesc, câștigă cea mai specifică (prefixul cel mai lung) — exact subiectul de la examenul 2022, unde 128.8.128.5 mergea pe interfața 4 (/28)."
        },
        {
          "intrebare": "Ce reprezintă intrarea 0.0.0.0/0 dintr-o tabelă de rutare?",
          "variante": [
            "Ruta implicită — folosită când nicio altă rută nu se potrivește",
            "Adresa de broadcast a rețelei locale",
            "O rețea direct conectată",
            "O rută marcată invalidă (unreachable)"
          ],
          "corect": 0,
          "explicatie": "0.0.0.0/0 e ruta default (gateway of last resort): se potrivește cu orice destinație, dar pierde în fața oricărei rute mai specifice; tipic duce spre Internet prin routerul ISP-ului."
        },
        {
          "intrebare": "Ce metrică folosește RIP și de la ce valoare destinația devine unreachable?",
          "variante": [
            "Hop count, cu maximul 16",
            "Bandwidth, cu maximul 100",
            "Cost setat de administrator, cu maximul 255"
          ],
          "corect": 0,
          "explicatie": "RIP e protocol distance vector cu metrică hop count; valoarea 16 înseamnă „destination unreachable” (mecanismul count-to-infinity), iar update-urile pleacă la fiecare 30 de secunde."
        }
      ]
    },
    {
      "id": "transport",
      "nume": "Portul Transport",
      "icon": "⚓",
      "sursa": "tcp_udp.pdf / tcp.md + rezolvări 2022–2024",
      "descriere": "Aici înveți nivelul transport cap-coadă: porturi și multiplexare, UDP cu antetul lui de 8 octeți, TCP cu antetul complet, handshake-ul în 3 pași, închiderea în 4 pași, numerele de secvență și fereastra glisantă.",
      "puncte": [
        {
          "id": "rol-transport-porturi",
          "titlu": "Nivelul transport și porturile",
          "tip": "terminal",
          "rezumat": "Nivelul transport leagă end-to-end procesele de pe două host-uri, iar porturile pe 16 biți sunt mecanismul prin care datagrama ajunge la procesul corect.",
          "detaliu": "Gândește-te la nivelul transport ca la căpitanul portului: el leagă direct două aplicații de pe două calculatoare, indiferent câte routere sunt între ele. Protocoalele de transport sunt **end-to-end** — asigură servicii de comunicație pentru nivelul aplicație și sunt implementate **numai la nivelul host-urilor**; nodurile intermediare urcă doar până la nivelul rețea. În stiva TCP/IP, la nivelul 4 stau **UDP** și **TCP**, iar deasupra lor aplicațiile: DNS, DHCP, SNMP, FTP, TFTP, SMTP, POP/IMAP, HTTP, Telnet.\n\nCum ajunge datagrama la procesul corect? Prin **porturi**: ID-uri care identifică procesele între care se realizează comunicația. Tripletul **<Protocol, IP Address, Port>** identifică în mod unic un proces în rețea. Portul e un număr pe **16 biți** (`65.535` porturi per host), iar deasupra lui UDP/TCP fiecare port e legat de câte un proces — IP aduce pachetul pe host, transportul îl livrează procesului care ascultă pe portul destinație.\n\nPorturile se împart în două lumi:\n\n- **Porturi standard (0–1023)** — asignate de **IANA**, folosite de aplicațiile server standard, doar de procese sistem sau utilizatori privilegiați; pe UNIX le găsești în `/etc/services`;\n- **Porturi temporare (efemere, 1024–65535)** — folosite de aplicațiile client.\n\nPorturile de știut pe de rost (au picat de nenumărate ori): **FTP** `20,21/tcp`, **Telnet** `23/tcp`, **SMTP** `25/tcp`, **HTTP** `80/tcp`, **POP** `110/tcp`, **IMAP** `143/tcp`, **LDAP** `389/tcp`, plus **DNS** `53/udp`, **DHCP** `67,68/udp`, **TFTP** `69/udp`, **SNMP** `161/udp`, **RPC** `111/udp`, **RTP** `5004/udp`; din rezolvarea 2022: **SSH** `22/tcp` și **HTTPS** `443/tcp`. Regula de memorat: mail, web, transfer de fișiere și terminal la distanță merg pe TCP; serviciile scurte întrebare-răspuns merg pe UDP.",
          "diagrama": null,
          "examen": "2013: porturile 25/389/23/143 (SMTP, LDAP, Telnet, IMAP); 2014: 22/25/53/143; 2018: SSH, SMTP, IMAP, HTTPS → 22, 25, 143, 443; 2019: port + transport pentru SMTP, TFTP, HTTPS, IMAP; 2022: SMTP 25/tcp, DNS 53/udp, HTTPS 443/tcp, SSH 22/tcp (vezi rezolvare_5_6_7.jpeg); 2004, 2005: rolul TCP/UDP în schema modelului TCP/IP.",
          "faptaCheie": "Tripletul <Protocol, IP, Port> identifică unic un proces în rețea; porturile 0–1023 sunt rezervate serverelor standard de IANA.",
          "sursa": "tcp_udp.pdf p.2–5, 8, 25 + imagini/2022/rezolvare_5_6_7.jpeg"
        },
        {
          "id": "udp-datagrama",
          "titlu": "UDP — datagrama de 8 octeți",
          "tip": "cufar",
          "rezumat": "UDP (RFC 768) oferă servicii datagram, fără conexiune, fără garanții și fără control de flux — dar cu un antet minuscul de doar 8 octeți.",
          "detaliu": "UDP e curierul grăbit al portului: nu sună înainte, nu cere confirmare, doar aruncă pachetul peste gard. Definit în **RFC 768**, oferă servicii de tip **datagram, connectionless** — o interfață simplă între nivelul aplicație și nivelul rețea.\n\nCaracteristicile lui, exact cum le cere examenul:\n\n- **fiabilitate scăzută** — nu se garantează livrarea datelor;\n- **nu asigură controlul fluxului sau al erorilor**;\n- **overhead redus** — de asta îl iubesc aplicațiile rapide;\n- suportă transmisii **unicast și multicast** (TCP e doar unicast).\n\nAntetul are fix **8 octeți** — patru câmpuri de câte 16 biți:\n\n- **Port Sursă (16b)** — identifică procesul care a trimis datagrama;\n- **Port Destinație (16b)** — identifică procesul căruia îi este destinată;\n- **UDP Length (16b)** — lungimea totală a datagramei, în octeți;\n- **Checksum (16b)** — suma de control, calculată peste un **pseudo-header IP** și datagrama UDP propriu-zisă.\n\nDupă antet urmează direct datele. Fără numere de secvență, fără ferestre, fără stări.\n\nCine folosește UDP? Aplicațiile care preferă viteza în locul garanțiilor: **DHCP** (`67,68/udp`), **TFTP** (`69/udp`), **DNS** (`53/udp`), **SNMP** (`161/udp`), **RPC** (`111/udp`) și **RTP** (`5004/udp`) pentru trafic în timp real. La examen ți se cer de regulă 4 dintre ele — alege oricare din listă. Tot de aici vine și clasicul calcul de overhead: într-un pachet audio RTP peste UDP/IP/Ethernet, componentele sunt RTP 12 + UDP 8 + IP 20 + Ethernet 14 (antet) + 4 (FCS) — adică 58 de octeți cu FCS Ethernet inclus, respectiv 54 fără FCS; rezolvarea scanată din 2023 notează totalul 54, deși listează și cei 4 octeți de FCS. Contribuția UDP e oricum exact 8 octeți.",
          "diagrama": "udp-header",
          "examen": "2013: formatul pachetelor UDP și semnificația câmpurilor; 2023: formatul datagramei UDP + 4 protocoale de aplicație peste UDP; 2024: enumerarea a 4 protocoale peste UDP (DNS, DHCP, TFTP, SNMP — vezi subiect_2024.md); 2021, 2023: overhead RTP/UDP/IP/Ethernet — componente 12+8+20+14 (+4 FCS), adică 58 de octeți cu FCS, respectiv 54 fără (rezolvarea scanată din 2023 notează totalul 54 deși listează și FCS-ul — vezi imagini/2023/rezolvare_5.jpg), din care UDP = 8.",
          "faptaCheie": "Antetul UDP are fix 8 octeți: Port Sursă, Port Destinație, Lungime și Checksum, fiecare pe 16 biți.",
          "sursa": "tcp_udp.pdf p.6–8 + subiect_2024.md + imagini/2023/rezolvare_5.jpg"
        },
        {
          "id": "antet-tcp",
          "titlu": "TCP — antetul segmentului",
          "tip": "terminal",
          "rezumat": "TCP (RFC 793) e orientat conexiune, fiabil și full-duplex; antetul lui are porturi pe 16b, numere de secvență/confirmare pe 32b, 6 flaguri și fereastră pe 16b.",
          "detaliu": "TCP, definit în **RFC 793**, e protocolul serios al portului: **orientat conexiune**, cu **fiabilitate ridicată** (garantează livrarea), cu **controlul fluxului și al erorilor** printr-un protocol cu **fereastră glisantă**, **full-duplex** și doar **unicast**. Preia datele de la aplicație ca **flux de octeți** (byte stream) și le transmite pe blocuri numite **segmente**.\n\nAntetul, câmp cu câmp (învață și dimensiunile!):\n\n- **Port Sursă (16b)** / **Port Destinație (16b)** — procesele care comunică;\n- **Număr de secvență (32b)** — fiecare octet din flux e numerotat: `0 <= SeqNo <= 2^32 - 1` (≈ 4,3 GB); e numărul de ordine al **primului octet de date din segment**, iar numerotarea pornește de la o valoare aleatoare aleasă la stabilirea conexiunii;\n- **Număr de confirmare (32b)** — numărul **următorului octet** pe care receptorul se așteaptă să-l primească; confirmările sunt **cumulative** și câmpul contează doar dacă flag-ul ACK e setat;\n- **Lungime antet (4b)** — în cuvinte de 32 de biți;\n- **Rezervat (6b)** și **Flags (6b)**: `URG` (segmentul conține mesaj urgent), `ACK` (numărul de confirmare e valid), `PSH` (receptorul să transfere imediat tot buffer-ul către aplicație), `RST` (resetare conexiune), `SYN` (sincronizare numere de secvență, primul pachet al conexiunii), `FIN` (emițătorul a terminat de transmis);\n- **Dimensiunea ferestrei (16b)** — numărul maxim de octeți pe care receptorul îi poate primi;\n- **Checksum (16b)** — peste un pseudo-header IP, antetul TCP și date;\n- **Urgent Pointer (16b)** — offset-ul până la datele urgente, valid doar cu URG setat;\n- **Opțiuni** (un octet cu tipul sau format tip-lungime-date) și **Padding**.",
          "diagrama": "tcp-header",
          "examen": "2003, 2005, 2010, 2012, 2021: formatul segmentelor TCP și semnificația fiecărui câmp din antet; 2015: dintr-un dump hex se identificau porturile și flag-urile setate (PSH, ACK).",
          "faptaCheie": "Numărul de secvență TCP are 32 de biți și numerotează fiecare octet din flux — până la aproximativ 4,3 GB fără repetiție.",
          "sursa": "tcp_udp.pdf p.9–14"
        },
        {
          "id": "tcp-handshake-3-pasi",
          "titlu": "Three-way handshake",
          "tip": "npc",
          "rezumat": "Conexiunea TCP se deschide în 3 pași: SYN (SEQ=x), SYN+ACK (SEQ=y, ACK=x+1), ACK (ACK=y+1) — apoi ambele capete sunt ESTABLISHED.",
          "detaliu": "Înainte să circule orice octet de date, clientul și serverul dau mâna în trei pași — **three-way handshake**. Serverul stă în starea `LISTEN` (**passive open**), clientul pornește (**active open**) și trece în `SYN_SENT`:\n\n- **Pasul 1, Client → Server:** flag **SYN**, cu `SEQ = x` (x = numărul inițial de secvență al clientului, ales aleator). SYN-ul sincronizează numerele de secvență.\n- **Pasul 2, Server → Client:** flag-urile **SYN + ACK**, cu `SEQ = y` și `ACK = x + 1`. Serverul trece în `SYN_RCVD`. ACK-ul confirmă primirea SYN-ului clientului.\n- **Pasul 3, Client → Server:** flag **ACK**, cu `ACK = y + 1`. Ambele capete ajung în **ESTABLISHED** și datele pot curge.\n\nDe ce `x + 1` dacă nu s-au trimis date? Pentru că **SYN „consumă” un număr de secvență** — e regula care încurcă pe toată lumea la examen.\n\nAșa arată în viața reală, în captura tcpdump din curs (Telnet, port 23):\n\n- `S 2668246764:2668246764(0) win 65535 <mss 1460>` — SYN-ul clientului;\n- `S 1722058968:1722058968(0) ack 2668246765 win 61320 <mss 1460>` — SYN+ACK-ul serverului (fix ISN-ul clientului + 1!);\n- `. ack 1 win 65535` — ACK-ul final.\n\nHandshake-ul e și piesa finală din scenariile mari de examen: după ARP și DNS, laptopul deschide conexiunea TCP către serverul web pe portul 80 cu exact această secvență SYN / SYN-ACK / ACK. Dacă știi cine trimite ce flag și ce numere pune în SEQ și ACK, ai rezolvat jumătate de subiect.",
          "diagrama": "tcp-handshake",
          "examen": "2022 și 2024: câmpurile și flag-urile folosite la stabilirea conexiunii (SYN cu SEQ=x, SYN+ACK cu ACK=x+1 și SEQ=y, ACK cu ACK=y+1 — vezi rezolvare_5_6_7.jpeg și subiect_2024.md); 2003, 2005, 2010, 2012, 2021: fazele conexiunii; 2019: analiză tcpdump cu SYN/SYN-ACK/ACK, mss 1460; 2013, 2014, 2018: scenarii ARP+DNS+TCP handshake pe portul 80.",
          "faptaCheie": "SYN consumă un număr de secvență — de aceea serverul răspunde cu ACK = x + 1 deși clientul n-a trimis niciun octet de date.",
          "sursa": "tcp_udp.pdf p.15, 17 + tcp.md + imagini/2022/rezolvare_5_6_7.jpeg"
        },
        {
          "id": "tcp-inchidere-stari",
          "titlu": "Închiderea conexiunii și stările TCP",
          "tip": "totem",
          "rezumat": "Închiderea cere 4 pași — FIN, ACK, FIN, ACK — pentru că fiecare parte trebuie să-și încheie propria direcție de transmisie.",
          "detaliu": "TCP e full-duplex, deci conexiunea are două sensuri — și fiecare sens se închide separat. De aici cei **4 pași** ai închiderii:\n\n- **Pasul 1:** partea care inițiază (active close) trimite **FIN** cu `SEQ = m` și trece în `FIN_WAIT_1`;\n- **Pasul 2:** cealaltă parte răspunde cu **ACK = m + 1**; inițiatorul trece în `FIN_WAIT_2`, iar cealaltă parte în `CLOSE_WAIT` (passive close) — ea încă poate trimite date;\n- **Pasul 3:** când termină și ea, trimite propriul **FIN** cu `SEQ = n` și intră în `LAST_ACK`;\n- **Pasul 4:** inițiatorul confirmă cu **ACK = n + 1** și intră în `TIME_WAIT`, unde așteaptă să „moară” segmentele retransmise; celălalt capăt ajunge în `CLOSED`.\n\nRegula de aur din curs: **pentru a se închide complet conexiunea, ambele părți trebuie să transmită câte un FIN**.\n\nStările pe care le cere diagrama de stări TCP:\n\n- `CLOSED` — nu există conexiune; `LISTEN` — serverul așteaptă apeluri;\n- `SYN-SENT` — cerere de conexiune trimisă; `SYN-RCVD` — cerere primită;\n- `ESTABLISHED` — conexiune stabilită;\n- `FIN-WAIT-1` — aplicația a cerut închiderea; `FIN-WAIT-2` — cealaltă parte a acceptat închiderea;\n- `TIME-WAIT` — se așteaptă dispariția segmentelor retransmise;\n- `CLOSE-WAIT` — se așteaptă ca aplicația locală să închidă; `LAST-ACK` — se așteaptă ultima confirmare.\n\nÎn captura din curs vezi finalul: `F 1052:1052(0) ack 107`, apoi `ack 1053`, apoi `F 107:107(0)`, apoi `ack 108` — exact cele patru mesaje, cu ACK = FIN-ul confirmat + 1.",
          "diagrama": "tcp-inchidere",
          "examen": "2003, 2005: gestiunea conexiunilor TCP — diagrama de stări, stabilirea și eliberarea conexiunii; 2010, 2012, 2021: fazele conexiunii, inclusiv închiderea.",
          "faptaCheie": "Conexiunea TCP se închide complet doar după ce ambele părți trimit câte un FIN — 4 pași, iar inițiatorul trece prin TIME_WAIT.",
          "sursa": "tcp_udp.pdf p.16–19 + tcp.md"
        },
        {
          "id": "secvente-ack-fereastra",
          "titlu": "Secvențe, confirmări și fereastra glisantă",
          "tip": "cufar",
          "rezumat": "Numerele de secvență ordonează octeții, confirmările cumulative spun „am primit tot până aici”, iar fereastra glisantă ține emițătorul în ritmul receptorului.",
          "detaliu": "Aici e motorul fiabilității TCP, și e **byte-oriented**: se numără octeți, nu segmente.\n\n**Controlul fluxului — fereastra glisantă.** Buffer-ul emițătorului are trei zone: octeți **trimiși și confirmați** (spațiul se reciclează), octeți **trimiși dar neconfirmați** și octeți care **pot fi trimiși imediat**. Fereastra are dimensiunea anunțată de receptor (**Size = receiver window**, câmpul Window din antet = numărul maxim de octeți pe care receptorul îi poate primi). Când sosește o confirmare — de exemplu `AckNo = 203` — fereastra **alunecă** înainte: octeții până la 202 sunt confirmați, iar emițătorul câștigă loc pentru octeți noi. Așa receptorul nu e niciodată inundat.\n\n**Controlul erorilor — Go-Back-N ARQ.** Exemplul din curs: emițătorul trimite segmentele cu `seq: 1201`, `seq: 1401`, `seq: 1601`, fiecare de 200 de octeți. Receptorul răspunde cu `ack: 1601` (confirmă primele două). Dacă segmentul 3 se pierde, nu vine ACK pentru el — la **time-out**, emițătorul îl retransmite, apoi primește `ack: 1801`.\n\n**Confirmările sunt cumulative:** ACK-ul poartă numărul următorului octet așteptat, deci confirmă implicit tot ce e înainte. De asta, dacă se pierde `ack: 1601` dar ajunge `ack: 1801`, nu se retransmite nimic — 1801 acoperă tot.\n\nȘi calculul-vedetă de examen: A trimite un segment cu `SEQ = 43`, iar B răspunde cu `ACK = 57`. Câți octeți de date a transmis A? `57 - 43 = 14` octeți — ACK-ul e exact ultimul octet primit + 1.",
          "diagrama": null,
          "examen": "2012, 2020, 2021: SEQ=43, ACK=57 → 14 octeți transmiși; 2016: confirmări cumulative — de ce pierderea unui ACK nu are efect; 2019: calculul octeților trimiși de client dintr-o captură tcpdump pe baza numerelor de secvență.",
          "faptaCheie": "Confirmările TCP sunt cumulative: un ACK = n confirmă toți octeții până la n − 1, deci un ACK pierdut e acoperit de următorul.",
          "sursa": "tcp_udp.pdf p.12, 20–24"
        }
      ],
      "recap": [
        {
          "intrebare": "Câți octeți are antetul UDP și din ce câmpuri e format?",
          "variante": [
            "8 octeți: Port Sursă, Port Destinație, Lungime, Checksum — fiecare pe 16 biți",
            "20 de octeți: porturi, număr de secvență, fereastră, checksum",
            "12 octeți: porturi, lungime, checksum, opțiuni"
          ],
          "corect": 0,
          "explicatie": "Antetul UDP are exact 8 octeți — patru câmpuri de câte 16 biți; numerele de secvență și fereastra există doar la TCP."
        },
        {
          "intrebare": "La three-way handshake, ce trimite serverul la pasul 2 dacă clientul a trimis SYN cu SEQ = x?",
          "variante": [
            "ACK simplu, cu ACK = x",
            "SYN + ACK, cu SEQ = y și ACK = x + 1",
            "FIN + ACK, cu ACK = x + 1",
            "SYN simplu, cu SEQ = x + 1"
          ],
          "corect": 1,
          "explicatie": "Serverul răspunde cu SYN+ACK: își anunță propriul număr inițial de secvență y și confirmă SYN-ul clientului cu ACK = x + 1, pentru că SYN consumă un număr de secvență."
        },
        {
          "intrebare": "Ce anunță câmpul Dimensiunea Ferestrei (Window Size) din antetul TCP?",
          "variante": [
            "Numărul maxim de segmente dintr-o conexiune",
            "Dimensiunea antetului în cuvinte de 32 de biți",
            "Numărul maxim de octeți pe care receptorul îi poate primi"
          ],
          "corect": 2,
          "explicatie": "Window Size e mecanismul de control al fluxului: receptorul anunță câți octeți mai poate primi, iar emițătorul nu depășește această fereastră."
        }
      ]
    },
    {
      "id": "aplicatii",
      "nume": "Biblioteca Aplicații",
      "icon": "📚",
      "sursa": "dns.pdf / apps.pdf / sockets.pdf",
      "descriere": "Aici înveți cum vorbesc aplicațiile pe Internet: DNS-ul care traduce nume în adrese IP, e-mailul cu SMTP/POP3/IMAP, FTP-ul și web-ul cu HTTP, porturile standard ale serviciilor și socket-urile cu care programezi tu însuți un client și un server.",
      "puncte": [
        {
          "id": "dns-ierarhie-si-inregistrari",
          "titlu": "DNS: ierarhia numelor și înregistrările",
          "tip": "terminal",
          "rezumat": "DNS e baza de date distribuită care convertește nume în adrese IP și invers, organizată ca un arbore: root → TLD → subdomeniu → calculator, cu informația stocată în înregistrări (Resource Records).",
          "detaliu": "Înainte de 1985, conversia nume→IP se făcea cu un fișier **hosts** descărcat de pe un server central prin FTP — imposibil de întreținut la scară mare: numele nu erau structurate și fișierul trebuia actualizat pe toate stațiile. Soluția: **Domain Name System** (RFC 1034, 1035), un serviciu critic care garantează unicitatea numelor și le asignează independent de locație.\n\nNumele sunt organizate ierarhic: rădăcina `.` (root), apoi **top-level domains** — generice (gTLD: `com`, `org`, `edu`, `mil`, `gov`, `net`, `biz`, `info`) sau de țară (ccTLD: `ro`, `us`, `uk`, `fr`) — apoi subdomeniul organizației (ex. `mta`) și numele calculatorului (ex. `www`). Un **FQDN** (Fully Qualified Domain Name) e concatenarea etichetelor separate prin punct: fiecare etichetă are maxim `63` de caractere, iar întregul nume maxim `255`.\n\nSpațiul de nume se împarte în **zone** care nu se suprapun; fiecare zonă are un **server de nume primar** (autoritar) și eventual **servere secundare** (replici). La vârful ierarhiei stau cele **13 servere rădăcină** (A–M.ROOT-SERVERS.NET), folosite pentru a afla serverele autoritare ale TLD-urilor.\n\nIntrările din baza de date DNS sunt **Resource Records** (RR), stocate în zone files:\n- `A` — adresă IPv4 pe 32 de biți; `AAAA` — adresă IPv6 pe 128 de biți\n- `NS` — serverul de nume autoritar al domeniului\n- `CNAME` — alias (nume canonic)\n- `MX` — serverul de e-mail al domeniului\n- `PTR` — pointer pentru **reverse DNS**: conversia IP→nume folosește ierarhia separată `in-addr.arpa`, unde 193.231.21.10 se scrie `10.21.231.193.in-addr.arpa`.\n\nRezervarea domeniilor o fac registrarii acreditați: Verisign (.com, .net), RoTLD (.ro), ICANN (.int).",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "O etichetă DNS are maxim 63 de caractere, iar un nume complet (FQDN) maxim 255 — și există exact 13 servere rădăcină, A–M.ROOT-SERVERS.NET.",
          "sursa": "dns.pdf p.2–9, 14–17"
        },
        {
          "id": "dns-rezolvarea-numelor",
          "titlu": "Rezoluția de nume: recursiv vs iterativ, portul 53",
          "tip": "npc",
          "rezumat": "Resolver-ul întreabă serverul de nume local; dacă acesta nu e autoritar, pleacă de la root și coboară în ierarhie prin referrals până obține IP-ul. Interogările merg pe UDP portul 53, iar răspunsurile se rețin în cache cu un TTL.",
          "detaliu": "Când o aplicație (ex. HTTP) are nevoie de o conversie de nume, apelează un program special numit **resolver** (clientul DNS). Resolver-ul contactează **serverul de nume local**. Dacă serverul e autoritar pentru domeniul cerut, răspunde direct; altfel interoghează alte servere din Internet **plecând de la rădăcină**, apoi comunică resolver-ului adresa IP.\n\nPentru `www.mta.ro` lanțul arată așa:\n- query 1 către **root server** → răspunde cu referral la serverul `.ro`\n- query 2 către **serverul ro** → referral la serverul `mta.ro`\n- query 3 către **serverul mta** (autoritar) → întoarce adresa IP a lui www.mta.ro\n\nServerul local joacă rolul de **Recursive DNS Server** pentru resolver (duce el toată munca), în timp ce spre serverele autoritare interogările merg iterativ, din referral în referral. În antetul mesajului DNS există flag-urile `RD` (recursion desired) și `RA` (recursion available), plus `QR` (query/response), `AA` (authoritative answer) și `TC` — pachet trunchiat la `512` octeți, folosit numai cu UDP.\n\nTransport: **interogările DNS folosesc UDP pe portul 53**, iar **transferurile de zonă folosesc TCP pe portul 53**.\n\n**Caching**: fiecare răspuns DNS include un **TTL** care spune cât poate fi ținută informația în cache; dacă răspunsul vine din cache, e marcat „unauthoritative\". Software de server: **BIND**; resolvere interactive: `nslookup`, `host`, `dig`. Servere DNS publice: Google `8.8.8.8` și `8.8.4.4`, OpenDNS `208.67.222.222` (cu blocare de site-uri malițioase).",
          "diagrama": "dns-rezolvare",
          "examen": "2015: explicarea pas cu pas a rezoluției recursive pentru www.mta.ro (resolver → server local → root → .ro → mta.ro); 2010, 2013, 2014, 2018, 2024: în scenariile ARP/DNS/TCP, interogarea și răspunsul DNS pe UDP/53 apar obligatoriu în tabelul de pachete (vezi subiect_2024.md, cerința 7).",
          "faptaCheie": "Interogările DNS circulă pe UDP portul 53; TCP pe portul 53 se folosește doar pentru transferurile de zonă.",
          "sursa": "dns.pdf p.10–13, 18–20"
        },
        {
          "id": "email-smtp-pop3-imap",
          "titlu": "E-mail: SMTP, POP3, IMAP și MIME",
          "tip": "totem",
          "rezumat": "Mesajul pleacă din clientul tău (MUA) prin SMTP către serverul local (MTA), care află din DNS (înregistrarea MX) serverul destinație și îl livrează tot prin SMTP; destinatarul îl citește prin POP3 sau IMAP.",
          "detaliu": "E-mailul e primul mare serviciu Internet (1971, Ray Tomlinson, ARPANET). Actorii: **MUA** (Mail User Agent — clientul: Outlook, Thunderbird), **MTA** (Mail Transfer Agent — serverul: Sendmail, Postfix, Exchange) și **LDA** (Local Delivery Agent, care depune mesajul în căsuța poștală).\n\nTraseul unui mesaj:\n- compui mesajul în MUA și dai „send\"\n- clientul îl transmite serverului de mail local (MTA) prin **SMTP**\n- MTA-ul întreabă DNS-ul care e serverul de mail al destinației, folosind înregistrări de tip **MX**\n- mesajul e livrat prin SMTP serverului destinație\n- destinatarul îl descarcă prin **POP3** sau **IMAP4**\n\n**SMTP** (Jon Postel, 1982, RFC 821) rulează pe portul `25/TCP` și e o „conversație\" text: `HELO`, `MAIL FROM:`, `RCPT TO:`, `DATA` (corpul se încheie cu o linie conținând doar `.`), `QUIT`. Cu `EHLO` verifici dacă serverul suportă extensiile ESMTP.\n\nFormatul mesajelor e RFC 822 (antet From/To/Subject + corp), dar acceptă doar text. **MIME** (RFC 2045–2049) adaugă `Content-Type` (text, image, audio, multipart...) și `Content-Transfer-Encoding`, iar fișierele binare se codifică **Base64**: 3 octeți devin 4 blocuri de 6 biți, deci mesajul crește cu 4/3 (×1,33).\n\nCitirea: **POP3** (1984, RFC 1939, port `110/TCP`) descarcă mesajele și le consultă offline — de regulă le șterge de pe server. **IMAP** (1988, RFC 3501, port `143/TCP`) ține cutia pe server, accesibilă de pe mai multe stații, cu extragere parțială. **Webmail** = acces din browser prin HTTPS, serverul web vorbind POP3/IMAP în spate.",
          "diagrama": null,
          "examen": "2013, 2014, 2018, 2019, 2022: s-a cerut portul standard al SMTP (25/TCP) și al IMAP (143/TCP) — în rezolvarea 2022 apare explicit „SMTP – TCP 25\" (rezolvare_5_6_7.jpeg).",
          "faptaCheie": "Codificarea Base64 transformă 3 octeți în 4 caractere, deci umflă mesajul cu ~33% (×1,33).",
          "sursa": "apps.pdf p.3–21"
        },
        {
          "id": "ftp-si-tftp",
          "titlu": "FTP și TFTP: transfer de fișiere",
          "tip": "terminal",
          "rezumat": "FTP folosește două conexiuni TCP — comenzi pe 21, date pe 20 — cu mod activ (PORT) sau pasiv (PASV); TFTP e varianta minimalistă pe UDP 69, cu stop-and-wait și fără autentificare, folosită la bootarea stațiilor.",
          "detaliu": "**FTP** (RFC 959) e unul dintre cele mai vechi servicii Internet: arhitectură client/server peste TCP, cu control al accesului, mod de lucru interactiv și conversie de format. Specific FTP-ului sunt cele **două conexiuni separate**: *Command Connection* către portul `21` al serverului și *Data Connection* pe portul `20`.\n\n- **Mod activ**: clientul trimite comanda `PORT`, indicând IP-ul și portul Y pe care ascultă; serverul se conectează el la client, de pe portul 20 spre Y. Merge doar dacă există conexiune directă client–server.\n- **Mod pasiv**: clientul (aflat în spatele unui firewall) trimite `PASV`; serverul răspunde cu portul Z pe care ascultă, iar clientul deschide conexiunea de date spre Z.\n\nParametrii PORT codifică portul în doi octeți: `PORT 193,231,21,10,9,8` înseamnă IP 193.231.21.10 și port 9×256+8 = `2312`.\n\n**Anonymous FTP**: servere publice unde te loghezi cu username `anonymous` și parola = adresa ta de e-mail, cu acces restricționat. Problema de securitate: parolele și datele circulă **în clar** — alternativele sunt FTPS (FTP over SSL) și SFTP (tunel SSH). Comenzi tipice: `open`, `user`, `pass`, `cd`/`lcd`, `ls`, `get`/`put`, `mget`/`mput`, `quit`.\n\n**TFTP** (Trivial FTP) e ruda minimalistă: folosește **UDP, serverul ascultă pe portul 69**, controlul fluxului și al erorilor e **stop-and-wait**, permite doar citirea și scrierea de fișiere (nu și listarea directoarelor), are 5 formate de mesaje, cod atât de compact încât încape în ROM și **nu are autentificare**. E utilizat pentru bootarea stațiilor din rețea.",
          "diagrama": null,
          "examen": "2019: portul și protocolul de transport pentru TFTP (69/UDP); 2023 și 2024: TFTP apare în baremul celor 4 protocoale de aplicație care folosesc UDP (vezi subiect_2024.md, punctul 5).",
          "faptaCheie": "FTP folosește două conexiuni TCP separate: portul 21 pentru comenzi și portul 20 pentru date.",
          "sursa": "apps.pdf p.22–31"
        },
        {
          "id": "http-si-www",
          "titlu": "HTTP și World Wide Web",
          "tip": "npc",
          "rezumat": "Browserul rezolvă numele prin DNS, se conectează pe portul 80 și cere pagina cu GET; HTTP e un protocol cerere-răspuns stateless, cu coduri 1xx–5xx, HTTPS pe 443/TCP și HTTP/3 peste QUIC+UDP.",
          "detaliu": "**WWW** = colecție de documente hypertext înlănțuite, creată de Tim Berners-Lee în 1990 la CERN (browserul Mosaic, 1993, a pornit boom-ul). Nu confunda Web-ul cu Internetul: Web-ul e un serviciu care rulează *peste* Internet. Tripleta de bază: **URL** + **HTML** + **HTTP**.\n\nUn URL localizează resursa: `protocol://hostname[:port]/path/filename` (ex. http://www.mta.ro:8080/index.html). Modul de operare: browserul extrage hostname-ul din URL, obține adresa IP prin **DNS**, se conectează la server pe portul specificat (**implicit 80**), trimite comanda `GET`, serverul caută pagina și o transmite, iar browserul o afișează formatat.\n\n**HTTP** e un protocol de tip cerere-răspuns: HTTP/1.0 (RFC 1945), HTTP/1.1 (RFC 2616), HTTP/2 (RFC 9113). Tipuri de cereri: `GET`, `HEAD`, `POST`, `PUT`, `DELETE`, `CONNECT`, `OPTIONS`, `TRACE`, `PATCH`. Răspunsurile au coduri pe clase:\n- `1xx` informațional, `2xx` succes (ex. 200 OK), `3xx` redirect, `4xx` eroare de client, `5xx` eroare de server\n\nHTTP e **stateless** — serverul nu reține nimic despre cererile anterioare; soluțiile sunt cookies, sesiuni pe server sau parametri codificați în URL. **Nonpersistent HTTP** (folosit de 1.0): câte o conexiune TCP pentru fiecare obiect transferat; **persistent HTTP** (1.1): mai multe obiecte pe aceeași conexiune.\n\n**HTTPS** (HTTP over SSL): criptarea traficului cu certificate digitale, pe portul `443/TCP` — 95% din traficul Web e criptat. **HTTP/3** (RFC 9114) schimbă complet transportul: rulează peste **QUIC + UDP**, cu TLS 1.3.",
          "diagrama": "http-schimb",
          "examen": "2018 și 2022: portul HTTPS (443/TCP) la grila de porturi; 2013, 2014, 2018, 2024: scenariile de acces web se termină cu TCP SYN / SYN-ACK / ACK către portul 80; 2015: identificarea unui mesaj HTTP GET dintr-un dump hexazecimal.",
          "faptaCheie": "HTTP/3 nu mai rulează peste TCP, ci peste QUIC + UDP; HTTPS clasic stă pe 443/TCP și acoperă 95% din traficul web.",
          "sursa": "apps.pdf p.32–47"
        },
        {
          "id": "porturi-si-protocoale-udp",
          "titlu": "Porturile serviciilor și protocoalele peste UDP",
          "tip": "cufar",
          "rezumat": "Grila clasică de examen: SMTP 25/TCP, SSH 22/TCP, HTTPS 443/TCP, DNS 53/UDP — plus cvartetul de protocoale de aplicație peste UDP: DNS, DHCP, TFTP, SNMP.",
          "detaliu": "Aproape în fiecare an pică o grilă „ce port folosește protocolul X?\". Din cursuri poți aduna tabelul complet:\n\n- **SMTP** — `25/TCP` (transfer de mesaje e-mail)\n- **POP3** — `110/TCP`; **IMAP** — `143/TCP` (acces la cutia poștală)\n- **FTP** — `21/TCP` comenzi + `20/TCP` date; **TFTP** — `69/UDP`\n- **HTTP** — `80/TCP`; **HTTPS** — `443/TCP`\n- **DNS** — `53/UDP` pentru interogări, `53/TCP` pentru transferuri de zonă\n- **SSH** — `22/TCP` (apare constant la examen; în rezolvarea 2022: „SSH – TCP 22\")\n\nA doua întrebare recurentă: „enumerați 4 protocoale de nivel aplicație care folosesc UDP\". Baremul 2024 (subiect_2024.md, punctul 5):\n- **DNS** — port 53, rezolvare nume → IP\n- **DHCP** — porturile 67/68 (UDP), obținerea automată a adresei IP\n- **TFTP** — port 69, transfer simplu de fișiere\n- **SNMP** — port 161, monitorizarea echipamentelor\n\nRegulă utilă de reținut: serviciile cu sesiuni și transfer fiabil (mail, web, fișiere, shell) stau pe **TCP**; schimburile scurte cerere-răspuns și bootstrap-ul (rezolvare de nume, configurare IP, boot din rețea, monitorizare) stau pe **UDP**.",
          "diagrama": null,
          "examen": "2022: SMTP 25/tcp, DNS 53/udp, HTTPS 443/tcp, SSH 22/tcp (rezolvare_5_6_7.jpeg); 2024: 4 protocoale peste UDP — DNS, DHCP, TFTP, SNMP (subiect_2024.md); 2019: port + transport pentru SMTP, TFTP, HTTPS, IMAP; 2018: porturile SSH/SMTP/IMAP/HTTPS (22, 25, 143, 443); 2013, 2014: porturile 25, 23, 143, 389 respectiv 22, 25, 53, 143.",
          "faptaCheie": "Din cvartetul clasic de examen, doar DNS merge pe UDP (53/udp) — SSH 22, SMTP 25 și HTTPS 443 sunt toate pe TCP.",
          "sursa": "apps.pdf p.12, 17, 19, 23, 31, 44 / dns.pdf p.12 / subiect_2024.md + rezolvări 2022"
        },
        {
          "id": "socketuri-client-server",
          "titlu": "Socket-uri: API-ul client-server",
          "tip": "totem",
          "rezumat": "Socket-urile sunt mecanismul IPC standard (din BSD 4.2) pentru aplicații de rețea: serverul TCP face socket → bind → listen → accept, clientul face socket → connect, iar pe UDP se comunică direct cu sendto/recvfrom.",
          "detaliu": "**Socket-urile** sunt un mecanism de comunicație între procese (IPC) și interfața API de acces la protocoalele de rețea, introduse în **BSD 4.2** — standardul de facto pentru programarea aplicațiilor de rețea.\n\nCaracteristici: **domeniul** `AF_UNIX` (adresa e un nume de fișier, procese pe același sistem) vs `AF_INET` (adresa = IP + port, procese din rețea); **tipul** `SOCK_STREAM` (circuit virtual → TCP) vs `SOCK_DGRAM` (datagramă → UDP); protocolul e de obicei `0`, dedus din tip.\n\nFluxul unui **server TCP**:\n- `socket()` — creează socket-ul, întoarce un descriptor (sau -1 la eroare)\n- `bind()` — îl leagă de adresa serverului (struct `sockaddr_in`: familie, port, IP)\n- `listen()` — fixează câte cereri de conexiune pot aștepta la coadă (limitat la 5 pe unele sisteme Unix)\n- `accept()` — acceptă o cerere și întoarce un **nou descriptor** plus adresa clientului\n- `send()`/`recv()` — schimb de date; întorc numărul de octeți efectiv transferați\n- `shutdown()`/`close()` — închid conexiunea și eliberează resursele\n\n**Clientul TCP** e mai simplu: `socket()` → `connect()` (cere legătura cu serverul) → `send()/recv()` → `close()`. Pe **UDP** nu există conexiune: serverul face `socket()` → `bind()` → `recvfrom()`/`sendto()`, care primesc/trimit împreună cu adresa partenerului.\n\nUn **server concurent** apelează `fork()` după accept: copilul închide socket-ul de ascultare și servește clientul, părintele închide socket-ul de conexiune și revine în accept. Funcții ajutătoare: `gethostbyname()` (resolver DNS), `htons()`/`htonl()` (rețeaua e big endian), `inet_pton()`/`inet_ntop()` (conversie adrese IP text ↔ binar), flag-ul `MSG_PEEK` la recv citește fără a goli buffer-ul.",
          "diagrama": "socket-flow",
          "examen": "2000, 2001, 2002, 2003: modelul socket-urilor și diagrama schimbului client-server, sintaxa și semantica apelurilor sistem (socket, bind, connect, listen, accept, send, recv) și scrierea unei aplicații client-server în C în domeniul UNIX — subiect recurent în toată perioada 2000–2003.",
          "faptaCheie": "Serverul TCP apelează obligatoriu în ordine socket → bind → listen → accept, iar accept() întoarce un descriptor NOU pentru fiecare client.",
          "sursa": "sockets.pdf p.2–23"
        }
      ],
      "recap": [
        {
          "intrebare": "Pe ce port și ce protocol de transport circulă interogările DNS obișnuite?",
          "variante": [
            "UDP, portul 53",
            "TCP, portul 53",
            "UDP, portul 69",
            "TCP, portul 80"
          ],
          "corect": 0,
          "explicatie": "Interogările DNS se transmit pe UDP portul 53; TCP pe portul 53 se folosește doar pentru transferurile de zonă (dns.pdf p.12)."
        },
        {
          "intrebare": "Ce apel de sistem folosește serverul TCP pentru a prelua o cerere de conexiune venită de la un client?",
          "variante": [
            "connect()",
            "accept()",
            "listen()"
          ],
          "corect": 1,
          "explicatie": "accept() preia cererea și întoarce un nou descriptor de socket plus adresa clientului; listen() doar stabilește coada de așteptare, iar connect() e apelul clientului."
        },
        {
          "intrebare": "Ce tip de înregistrare DNS indică serverul de e-mail al unui domeniu?",
          "variante": [
            "A",
            "MX",
            "PTR",
            "CNAME"
          ],
          "corect": 1,
          "explicatie": "MX (cod 15) numește serverul de e-mail al domeniului — exact înregistrarea pe care o caută MTA-ul înainte să livreze un mesaj; A e adresă IPv4, PTR e pentru reverse lookup, CNAME e alias."
        }
      ]
    },
    {
      "id": "wireless",
      "nume": "Turnul Wireless",
      "icon": "📡",
      "sursa": "Wireless Communications 2026.pdf",
      "descriere": "Urci în Turnul Wireless ca să vezi cum e construită o rețea 802.11 (BSS, ESS, AP, SSID) și cum își împart stațiile aerul: CSMA/CA, problema nodului ascuns, RTS/CTS și ACK-uri la nivel MAC.",
      "puncte": [
        {
          "id": "arhitectura-802-11",
          "titlu": "Wi-Fi și arhitectura 802.11: BSS, ESS, SSID",
          "tip": "terminal",
          "rezumat": "802.11 organizează rețeaua în BSS-uri: ad-hoc (IBSS, fără AP dedicat) sau infrastructură (cu AP dedicat), iar mai multe BSS-uri legate printr-un sistem de distribuție formează un ESS.",
          "detaliu": "Wi-Fi e numele comercial al familiei de standarde **IEEE 802.11** (a, b, g, n, ac, ax, be…), care reglementează nivelul fizic și MAC pentru WLAN. De reținut din start: comunicația Wi-Fi este **half-duplex** — nu transmiți și recepționezi simultan pe același canal.\n\nO rețea WLAN are două tipuri de componente: **stațiile client (STA)** — laptop, tabletă, smartphone — și **punctele de acces (AP)**, care conectează clienții la un **sistem de distribuție (DS)**.\n\nModurile de organizare:\n- **Independent BSS (IBSS)** — modul ad-hoc: conectare directă, peer-to-peer, fără un AP dedicat; unul dintre dispozitive preia rolul de AP și e identificat prin BSSID.\n- **Infrastructure BSS** — conectare printr-un AP dedicat; celula e identificată prin **BSSID** (adresa MAC a AP-ului).\n- **ESS (Extended Service Set)** — grup de BSS-uri interconectate printr-un DS (hub/switch/router/AP), identificat prin **ESSID**.\n\nDin perspectiva clientului: **SSID** e numele rețelei (profilul), iar **BSSID** e adresa MAC a AP-ului cel mai apropiat. Într-un ESS toate celulele au același SSID, dar fiecare AP are BSSID diferit — așa migrezi între celule păstrând SSID-ul și conectivitatea, schimbând doar BSSID-ul. Un AP poate avea definite mai multe profiluri (SSID-uri), cu acces pe bază de credențiale diferite.\n\nPe 2,4 GHz sunt alocate 14 canale (max. 13 în Europa, 11 în SUA), cu ecart de 5 MHz între ele și lățime de 20/22 MHz — de aceea routerele wireless folosesc de obicei canalele `1, 6 și 11`, seturi care nu se suprapun.",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "Într-un ESS toate AP-urile împart același SSID, dar fiecare AP are BSSID-ul propriu — adică adresa lui MAC.",
          "sursa": "Wireless Communications 2026.pdf p.10–12, 20–25"
        },
        {
          "id": "de-ce-nu-csma-cd-wireless",
          "titlu": "De ce nu merge CSMA/CD pe wireless",
          "tip": "npc",
          "rezumat": "Pe radio nu poți transmite și asculta simultan, semnalul se atenuează cu distanța, iar nodurile ascunse fac carrier sense-ul nesigur — așa că 802.11 evită coliziunile în loc să le detecteze.",
          "detaliu": "La Ethernet clasic, CSMA/CD funcționează pentru că stația transmite și ascultă simultan: dacă semnalul recepționat diferă de cel transmis, tocmai a detectat coliziunea. Pe radio, rețeta asta pică, din motive care apar direct în curs:\n\n- **Semnalele radio sunt atenuate** proporțional cu distanța și cu obstacolele traversate — ce „auzi\" tu la emițător nu e ce „aude\" receptorul.\n- Comunicația Wi-Fi este **half-duplex**: nu poți transmite și asculta în același timp pe canal, deci nu ai cum să compari semnalul tău cu ce e pe mediu.\n- Există **noduri ascunse**: A și C se văd amândouă cu B (AP-ul), dar nu se „văd\" între ele — coliziunea se produce la B, fără ca emițătorii să o poată sesiza.\n\nConcluzia standardului 802.11: nu mai încerci să **detectezi** coliziunile, ci să le **eviți** — de aici **CSMA/CA** (Collision Avoidance). Iar când coliziunea totuși se întâmplă, o afli indirect: dacă transmisia nu a avut succes — adică nu s-a recepționat niciun **ACK** de la destinatar — se presupune că a apărut o coliziune și cadrul se retransmite.\n\nȚine minte contrastul pentru examen: la 802.3 coliziunea se detectează în timpul transmisiei (stația oprește emisia și trimite semnalul JAM), la 802.11 coliziunea se deduce abia după transmisie, din lipsa confirmării.",
          "diagrama": null,
          "examen": "2024: prezentarea protocolului CSMA/CD din Ethernet (vezi subiect_2024.md — algoritm, JAM 32 biți, backoff exponențial binar); 2016: de ce cadrele Ethernet au dimensiune minimă pentru detectarea coliziunilor; 2013, 2000: CSMA/CD și limitele 802.3. Contrastul CD (detectare) vs CA (evitare) e completarea naturală a acestor subiecte.",
          "faptaCheie": "În 802.11 coliziunea nu se detectează, se deduce: niciun ACK recepționat = coliziune presupusă, cadru retransmis.",
          "sursa": "Wireless Communications 2026.pdf p.11, 26–27; subiect_2024.md (CSMA/CD)"
        },
        {
          "id": "csma-ca-pas-cu-pas",
          "titlu": "CSMA/CA pas cu pas",
          "tip": "totem",
          "rezumat": "În CSMA/CA stația ascultă mediul, așteaptă un interval IFS (plus backoff exponențial binar dacă mediul a fost ocupat) și abia apoi transmite, iar receptorul confirmă fiecare cadru cu un ACK.",
          "detaliu": "**CSMA/CA** (Carrier Sense Multiple Access with Collision Avoidance) coordonează accesul la mediu în mod **distribuit** — nu există un arbitru central. Fiecare dispozitiv „scanează\" mediul înconjurător pentru unde de radio-frecvență peste un anumit nivel de intensitate înainte de a începe transmisia.\n\nAlgoritmul, pas cu pas, pentru o stație care are un cadru de transmis:\n\n- Observă întâi dacă mediul de comunicație este liber.\n- **Dacă da**: așteaptă eliberarea mediului pentru un interval egal cu **IFS** (Inter Frame Spacing), după care începe să transmită.\n- **Dacă nu** (mediul e ocupat la momentul inițial sau se ocupă pe parcursul așteptării): stația amână transmisia și continuă să monitorizeze mediul până se încheie transmisia curentă.\n- După ce se încheie transmisia curentă, stația mai așteaptă încă un interval **IFS + un timp de backoff exponențial binar**, după care transmite dacă mediul este liber.\n\nConfirmarea: când un AP primește un cadru de la un client, transmite un **acknowledge (ACK)** — clientul elimină astfel eventualitatea unei coliziuni și nu mai retransmite cadrul. Dacă nu s-a recepționat niciun ACK, se presupune că a apărut o coliziune.\n\nPe axa timpului, ciclul repetat al CSMA/CA fără RTS/CTS arată așa: `DIFS → BO → DATA → SIFS → ACK`. **DIFS** (Distributed IFS) e așteptarea dinaintea datelor, **SIFS** (Short IFS) e intervalul scurt dinaintea ACK-ului, iar **BO** e intervalul de backoff. Peste acest schelet se poate activa opțional mecanismul RTS/CTS.",
          "diagrama": "csma-ca",
          "examen": null,
          "faptaCheie": "Ciclul CSMA/CA fără RTS/CTS: DIFS → backoff → DATA → SIFS → ACK — SIFS-ul scurt garantează că ACK-ul prinde primul canalul.",
          "sursa": "Wireless Communications 2026.pdf p.26–28"
        },
        {
          "id": "problema-nodului-ascuns",
          "titlu": "Problema nodului ascuns (și a celui expus)",
          "tip": "cufar",
          "rezumat": "Două stații care se văd amândouă cu AP-ul, dar nu una pe alta, produc coliziuni pe care nu le pot sesiza — problema nodului ascuns; simetric există și problema nodului expus.",
          "detaliu": "Imaginează-ți trei noduri pe o linie: **A – B – C**, unde B are rol de AP. Raza radio e limitată — semnalele sunt atenuate proporțional cu distanța și obstacolele traversate — așa că apar două situații clasice:\n\n**Problema nodului ascuns**: nodurile A și C sunt vizibile pentru B, dar nu se „văd\" între ele. Când C transmite către B, A nu aude nimic — pentru A mediul pare liber, deci poate începe și el să transmită. Rezultatul: coliziune la B, pe care nici A, nici C nu o pot sesiza direct. Carrier sense-ul simplu e păcălit: „liber la mine\" nu înseamnă „liber la receptor\".\n\n**Problema nodului expus** e simetrica ei: B nu are voie să transmită către C întrucât sesizează un semnal transmis de A către D — chiar dacă transmisia B→C nu ar interfera cu A→D. Aici carrier sense-ul e prea prudent și blochează o transmisie care ar fi mers.\n\nAmbele probleme vin din aceeași realitate radio: fiecare stație are propria zonă de acoperire, iar ce contează pentru succesul transmisiei e ce se întâmplă la **receptor**, nu la emițător.\n\nPentru nodul ascuns, IEEE 802.11 oferă mecanismul opțional **RTS/CTS** (Request to Send / Clear to Send): un schimb scurt de cadre de control anunță intenția de transmisie, iar CTS-ul emis de receptor e auzit inclusiv de stațiile pe care emițătorul nu le aude — ele își amână accesul pe durata anunțată.",
          "diagrama": "hidden-node",
          "examen": null,
          "faptaCheie": "„Mediu liber la emițător\" nu garantează „mediu liber la receptor\" — asta e toată drama nodului ascuns.",
          "sursa": "Wireless Communications 2026.pdf p.26, 28"
        },
        {
          "id": "rts-cts-ack-mac",
          "titlu": "RTS/CTS și ACK-urile la nivel MAC",
          "tip": "terminal",
          "rezumat": "RTS/CTS e handshake-ul opțional care rezervă canalul înainte de date, iar ACK-ul MAC confirmă fiecare cadru de date; toate trei sunt cadre de control minimale, de 14–20 octeți.",
          "detaliu": "**RTS/CTS** (Request to Send / Clear to Send) este un mecanism **opțional** din IEEE 802.11, construit peste CSMA/CA. Înainte de date, emițătorul trimite un cadru scurt **RTS** (inițiere handshake înainte de transmiterea de date), iar receptorul răspunde cu **CTS** (acceptare). Abia apoi curg datele, urmate de **ACK**.\n\nSecvența completă pe axa timpului: `DIFS → BO → RTS → SIFS → CTS → SIFS → DATA → SIFS → ACK`.\n\nCheia e câmpul **Duration** din cadrele de control: durata estimată de ocupare a canalului. Celelalte stații care detectează RTS-ul sau CTS-ul își setează **NAV** (Network Allocation Vector) și își amână accesul (defer access) exact cât s-a anunțat — inclusiv stațiile ascunse, care nu aud emițătorul, dar aud CTS-ul receptorului.\n\nToate trei sunt **cadre de control (tipul 1)** în 802.11, cu subtipurile RTS (`1011`), CTS (`1100`) și ACK (`1101`), iar formatele lor sunt minimale:\n\n- **RTS**: Frame Control (2) + Duration (2) + RA — Receiver Address (6) + TA — Transmitter Address (6) + FCS (4) = 20 octeți.\n- **CTS** și **ACK**: Frame Control (2) + Duration (2) + RA (6) + FCS (4) = 14 octeți.\n\n**ACK-ul la nivel MAC** este transmis la primirea unui cadru de date; dacă emițătorul nu-l primește, retrimite cadrul după expirarea unui contor de timp. Așa își asigură 802.11 livrarea, în lipsa detectării coliziunilor. Prețul RTS/CTS: două cadre și două SIFS-uri în plus pe fiecare ciclu — de aceea rămâne opțional.",
          "diagrama": null,
          "examen": null,
          "faptaCheie": "Un cadru RTS are exact 20 de octeți, iar CTS și ACK doar 14 — Frame Control, Duration, adresă/adrese și FCS, nimic altceva.",
          "sursa": "Wireless Communications 2026.pdf p.26–28, 45, 47, 53"
        }
      ],
      "recap": [
        {
          "intrebare": "Într-o rețea 802.11 în modul infrastructură, ce este BSSID-ul?",
          "variante": [
            "Adresa MAC a punctului de acces",
            "Numele rețelei pe care îl vezi la conectare",
            "Adresa IP a gateway-ului wireless"
          ],
          "corect": 0,
          "explicatie": "BSSID = adresa MAC a AP-ului; numele rețelei este SSID-ul, același pentru toate AP-urile dintr-un ESS."
        },
        {
          "intrebare": "Cum își dă seama o stație 802.11 că transmisia ei s-a ciocnit cu alta?",
          "variante": [
            "Compară în timpul emisiei semnalul recepționat cu cel transmis",
            "Nu primește niciun ACK pentru cadrul transmis",
            "Primește un semnal JAM de 32 de biți de la celelalte stații",
            "AP-ul îi trimite un cadru special de eroare"
          ],
          "corect": 1,
          "explicatie": "În CSMA/CA coliziunea nu poate fi detectată direct: dacă nu se recepționează niciun ACK, se presupune că a apărut o coliziune; compararea semnalelor și JAM-ul țin de CSMA/CD (Ethernet)."
        },
        {
          "intrebare": "În secvența RTS/CTS, ce interval separă între ele cadrele RTS, CTS, DATA și ACK?",
          "variante": [
            "SIFS (Short Inter Frame Spacing)",
            "DIFS (Distributed Inter Frame Spacing)",
            "Un interval de backoff aleator"
          ],
          "corect": 0,
          "explicatie": "Diagrama din curs: DIFS + backoff apar doar la începutul ciclului, apoi RTS–SIFS–CTS–SIFS–DATA–SIFS–ACK."
        }
      ]
    }
  ]
};
