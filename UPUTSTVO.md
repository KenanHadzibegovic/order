# PINIT Order

Naručivanje za stolom → narudžba se pojavi na ekranu u kuhinji → statistika smjene.
Isti pristup kao glavni PINIT server: **nula zavisnosti**, samo Node.js.

---

## Pokretanje na svom računaru

```bash
node server.js
```

Otvara se na portu 3000:

| Adresa | Za koga |
|---|---|
| `http://localhost:3000/` | gost ili konobar — bira jela |
| `http://localhost:3000/kuhinja` | ekran/tablet u kuhinji |
| `http://localhost:3000/statistika` | šef smjene |

Telefoni na istoj Wi-Fi mreži otvaraju adresu koju server ispiše pri pokretanju
(npr. `http://192.168.0.14:3000/`).

Narudžbe se čuvaju u `data-order.json` pored servera. Brisanje tog fajla = čist dan.

---

## Postavljanje na Render

1. Ubaci folder u Git repozitorij (GitHub).
2. Na Renderu: **New → Web Service** → izaberi repozitorij.
3. Render sam pročita `render.yaml`. Ako pita ručno:
   - Runtime: **Node**
   - Build Command: *(prazno)*
   - Start Command: `node server.js`
4. Port se ne dira — server sluša `process.env.PORT` koji Render sam dodijeli.

> Napomena za free plan: servis se uspava nakon 15 minuta bez saobraćaja i
> disk nije trajan — `data-order.json` se briše pri svakom novom deployu.
> Za pravi restoran treba plaćeni plan sa diskom ili baza (Postgres).

---

## Kako radi vrijeme pripreme

Nije fiksan broj iz jelovnika. Server računa po narudžbi (`procjena()` u `server.js`):

```
osnova    = najduže jelo u narudžbi
dodatno   = +1,2 min za svaku dodatnu porciju
zauzetost = +1,5 min za svaku narudžbu koja je već u redu
```

Rezultat je između 2 i 45 minuta. Gost vidi odbrojavanje, kuhinja vidi štopericu —
kad prođe procjena, tiket pocrveni. Statistika poredi stvarno vrijeme sa procjenom
i računa procenat narudžbi završenih u roku.

---

## Tok statusa

```
0 primljeno → 1 u pripremi → 2 spremno → 3 servirano
```

Kuhinja mijenja status dugmadima na tiketu. Gostov ekran to vidi u sekundi
(provjera svake sekunde), kuhinjska ploča se osvježava svake 2,5 sekunde.

---

## Izmjena jelovnika

Sve je u **`public/meni.js`** — jedan fajl, čita ga i server i preglednik.

```js
{ id: 'cevapi', naziv: 'Ćevapi', opis: '10 komada, lepinja, luk',
  kat: 'glavno', cijena: 9.00, prep: 12, ic: 'cevapi' }
```

- `kat` — mora postojati u `KATEGORIJE` na vrhu fajla
- `prep` — planirano vrijeme pripreme u minutama
- `ic` — ime ikone iz `public/ikone.js`

Nema emojija. Sve ikone su ručno crtani SVG-ovi u `public/ikone.js`, nasljeđuju
boju roditelja (`currentColor`), pa su svugdje PINIT zelene. Nova ikona = novi
ključ u `IKONE` i onda `ic: 'ime'` u jelovniku.

---

## API

| Metoda | Putanja | Šta radi |
|---|---|---|
| GET | `/api/meni` | jelovnik + kategorije |
| GET | `/api/narudzbe?od=TS` | narudžbe od vremena TS |
| GET | `/api/narudzbe/:id` | jedna narudžba (gost prati status) |
| POST | `/api/narudzbe` | `{sto, stavke:[{id,kol}], napomena}` → `{id, broj, eta}` |
| PATCH | `/api/narudzbe/:id` | `{status: 0-3}` |
| GET | `/api/statistika` | KPI, po satu, top jela, po stolovima |
| POST | `/api/demo` | napuni dan sa 28 primjera (za prikaz) |
| POST | `/api/reset` | obriši sve narudžbe |

---

## Fajlovi

```
server.js              server + API + procjena vremena + statistika
package.json           ime i start skripta
render.yaml            postavke za Render
public/index.html      gost/konobar naručuje
public/kuhinja.html    ekran kuhinje
public/statistika.html statistika smjene
public/meni.js         jelovnik (server i preglednik dijele ovaj fajl)
public/ikone.js        sve SVG ikone
```

---

## Šta ovdje još ne postoji

Namjerno, da ostane jednostavno: nema naloga i lozinki, nema računa/fiskalizacije,
nema šanka odvojenog od kuhinje (pića se prikazuju na istom tiketu, `SANK` u
`meni.js` ih već označava), nema historije po danima — statistika gleda samo
današnji dan.
