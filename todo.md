<h1>Todos</h1>
Main:
web
    - merch ajánlat jobboldalt slideshow
mobil
    - 3 mp után képernyő közép
- Videókra cserélni a hátteret

Zene:
- playlist felső option border dissap -> kijelölés miatt
- Videók címe alatt | utáni rész

!!! A szekció átmeneteket megvilágítja a kurzor animáció

Merch:
- Képen slideshowban - további kepek preview (mobilon swipeolható legyen - weben nyilakkal)
- Méret kiválaszt, darabszám kiválaszt -> hozzáadom a kosárhoz
- Kosár oldal, ikon

Admin:
- login Cloudflare auth
- merch darab, méret, komplett item, rendelés visszacsekk
- rendelésről menjen email (email kliens)
- 

Dev domain:
dystopia-merch.blanar-levente.workers.dev


Amit neked kell még csinálnod (.dev.vars fájlban vannak a helyőrzők):

Stripe fiók → teszt mód API kulcs (STRIPE_SECRET_KEY)
Stripe CLI-vel generált webhook secret lokális teszteléshez (STRIPE_WEBHOOK_SECRET) — stripe listen --forward-to localhost:8787/api/webhooks/stripe
Resend fiók + verifikált domain + API kulcs (RESEND_API_KEY, RESEND_FROM_EMAIL)
A rendelés-értesítés célcíme (ORDER_NOTIFICATION_EMAIL)