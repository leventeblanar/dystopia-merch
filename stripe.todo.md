# Stripe fizetés — bekötési teendők

Az implementáció (kód szinten) kész: `worker/index.ts` tartalmazza a `/api/checkout` és
`/api/webhooks/stripe` végpontokat, a frontend (`CheckoutPage`, `OrderSuccessPage`,
`OrderCancelledPage`) be van kötve. Ez a fájl azt listázza, hogy **neked** mit kell még
beállítanod ahhoz, hogy ez éles/tesztelhető állapotba kerüljön.

> **Fontos:** a Worker NEM az `.env` fájlt olvassa, hanem a `.dev.vars` fájlt (helyi
> fejlesztéshez) és `wrangler secret`-eket (élesben). A repo gyökerében lévő `.env` fájl
> jelenleg csak két placeholder kommentet tartalmaz ("STRIPE LOGIN CRED", "SMTP CRED"),
> nincs sehova bekötve — nyugodtan figyelmen kívül hagyható vagy törölhető.

---

## 1. `.dev.vars` — mit kell kitölteni

A fájl már létezik a repo gyökerében (gitignore-olva), placeholder értékekkel. Ezeket kell
lecserélni valós értékekre:

| Változó | Mi ez | Honnan szerzed |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe titkos API kulcs (teszt mód) | Stripe Dashboard → **Test mode** bekapcsolva → Developers → API keys → "Secret key" (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook aláírás-ellenőrző kulcs | Lokális teszteléshez a **Stripe CLI** adja (`stripe listen` parancs kimenete, lásd 2/e lépés) — ez más, mint az éles Dashboard-webhook secret-je |
| `RESEND_API_KEY` | Resend API kulcs | Resend Dashboard → API Keys → Create API Key |
| `RESEND_FROM_EMAIL` | Feladó email cím | Egy cím egy **Resend-ben verifikált domainen** (pl. `orders@dystopia-merch.hu`) — sima Gmail-cím NEM lesz jó, domain-verifikáció szükséges |
| `ORDER_NOTIFICATION_EMAIL` | Ide jönnek a rendelés-értesítések | Bármilyen létező email cím — ezt nem kell verifikálni (ez a "to" cím, nem a "from") |
| `PUBLIC_BASE_URL` | Már be van állítva `http://localhost:8787`-re | Nem kell módosítani, ez a `wrangler dev` alapértelmezett portja |

---

## 2. Lépésről lépésre — helyi teszteléshez

- [ ] **a) Stripe fiók**
  1. Regisztrálj / lépj be a [dashboard.stripe.com](https://dashboard.stripe.com)-ra.
  2. Kapcsold be a **Test mode**-ot (jobb felső kapcsoló).
  3. Developers → API keys → másold ki a Secret key-t → `STRIPE_SECRET_KEY`-be.

- [ ] **b) Stripe CLI telepítése** (a webhook helyi teszteléséhez)
  ```bash
  brew install stripe/stripe-cli/stripe
  stripe login
  ```
  Egyszeri lépés, a böngészőben hitelesíted a CLI-t a Stripe fiókodhoz.

- [ ] **c) Resend fiók**
  1. Regisztrálj a [resend.com](https://resend.com)-on.
  2. Domains → Add Domain → add meg egy saját domaint (pl. `dystopia-merch.hu`), és tedd
     be a DNS szolgáltatódnál a kért TXT/CNAME rekordokat (domain-verifikáció — enélkül
     a Resend nem enged küldeni).
  3. API Keys → Create API Key → `RESEND_API_KEY`-be.
  4. `RESEND_FROM_EMAIL` = egy cím ezen a verifikált domainen, pl. `orders@dystopia-merch.hu`.

- [ ] **d) `.dev.vars` kitöltése** a fenti valós értékekkel. A `STRIPE_WEBHOOK_SECRET`-et
  egyelőre hagyd üresen/placeholder-en, azt az (e) lépésben kapod meg.

- [ ] **e) Két terminál, egyszerre futtatva**
  ```bash
  # 1. terminál — az app (Vite build watch + wrangler dev)
  npm run cf:dev

  # 2. terminál — Stripe events továbbítása a helyi workerhez
  stripe listen --forward-to localhost:8787/api/webhooks/stripe
  ```
  A `stripe listen` kiír egy `whsec_...` kezdetű kulcsot — **ezt írd be a `.dev.vars`
  `STRIPE_WEBHOOK_SECRET` sorába**, majd állítsd le és indítsd újra a `cf:dev`-et (a
  `.dev.vars` csak induláskor töltődik be, futás közbeni módosítás nem elég).

- [ ] **f) Végigtesztelés böngészőben**
  1. `/merch` → kosárba rakás → `/cart` → "Tovább a fizetéshez" → töltsd ki a szállítási
     formot (`/checkout`).
  2. A Stripe fizetőoldalon teszt kártyaszám: `4242 4242 4242 4242`, bármilyen jövőbeli
     lejárat, bármilyen 3 jegyű CVC.
  3. Ellenőrizd:
     - a 2. terminál mutatja a `checkout.session.completed` eventet,
     - a böngésző `/order/success`-re ugrik,
     - a kosár kiürül,
     - megérkezik az email az `ORDER_NOTIFICATION_EMAIL` címre.
  4. D1-ben ellenőrizhető, hogy a rendelés `paid` státuszú lett-e:
     ```bash
     npx wrangler d1 execute dystopia-merch-db --local --command "SELECT * FROM orders;"
     ```

- [ ] **g) Sikertelen/megszakított fizetés tesztelése**
  - Elutasított kártya: `4000 0000 0000 0002`.
  - Megszakítás: a Stripe oldalon vissza-gomb / bezárás → `/order/cancelled`-re kell
    érkezni, a kosár tartalma nem törlődik.

- [ ] **h) Készlet-guard tesztelése**
  - Állíts be egy variant stockot 0-ra lokálisan, próbálj vele checkout-olni →
    `POST /api/checkout` 409-et kell adjon, nem jön létre se Stripe session, se order.

---

## 3. Élesítés előtt

- [ ] **a) Migráció alkalmazása az éles D1-en is** (eddig csak lokálisan futott le):
  ```bash
  npx wrangler d1 execute dystopia-merch-db --remote --file=./migrations/0002_create_orders.sql
  ```

- [ ] **b) Éles secretek beállítása** (ezek NEM `.dev.vars`-ból jönnek, külön kell
  beállítani a Cloudflare oldalon):
  ```bash
  npx wrangler secret put STRIPE_SECRET_KEY
  npx wrangler secret put STRIPE_WEBHOOK_SECRET
  npx wrangler secret put RESEND_API_KEY
  npx wrangler secret put RESEND_FROM_EMAIL
  npx wrangler secret put ORDER_NOTIFICATION_EMAIL
  ```

- [ ] **c) Éles Stripe webhook endpoint létrehozása** a Stripe Dashboardban:
  - Developers → Webhooks → Add endpoint
  - URL: `https://dystopia-merch.blanar-levente.workers.dev/api/webhooks/stripe`
  - Esemény(ek): `checkout.session.completed` (opcionálisan `checkout.session.expired`)
  - Az itt kapott **signing secret** megy a `STRIPE_WEBHOOK_SECRET` prod secretbe —
    **ez más, mint a helyi Stripe CLI-s secret**, ne keverd össze.

- [ ] **d) Teljes E2E teszt élesben, teszt Stripe kulcsokkal**, mielőtt élő kulcsokra
  váltanál — ugyanazok a lépések, mint a 2. pontban, csak a deploy-olt URL-en.

- [ ] **e) Váltás live módra**, amikor minden stabil: ugyanezekkel a lépésekkel (b–c),
  csak élő (`sk_live_...`) Stripe kulcsokkal és élő webhook endpoint secret-tel.

---

## Érintett/új fájlok (referenciaként)

- `migrations/0002_create_orders.sql` — `orders` + `order_items` táblák
- `worker/index.ts` — `/api/checkout`, `/api/webhooks/stripe`
- `.dev.vars` — helyi secretek (lásd fent)
- `wrangler.jsonc` — `PUBLIC_BASE_URL` nem-titkos var
- `src/context/CartContext.jsx` — `clearCart()`
- `src/Pages/CartPage.jsx` — checkout gomb bekötve
- `src/Pages/CheckoutPage.jsx` + `.css` — szállítási form
- `src/Pages/OrderSuccessPage.jsx`, `src/Pages/OrderCancelledPage.jsx`
- `src/App.jsx` — `/checkout`, `/order/success`, `/order/cancelled` route-ok
