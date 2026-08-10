# Dystopia Merch

Ez a repo nem csak egy sima Vite frontend. A merch API a Cloudflare Workerbol jon, a statikus fajlokat pedig a Worker `ASSETS` bindinggel szolgaltatja ki.

## Fontos kulonbseg

- `npm run build`
  csak a `dist/` statikus buildet kesziti el
- `npm run preview`
  csak sima Vite statikus preview, a Worker API nelkul
- `npm run cf:dev`
  lokalis Worker + asset futtatas
- `npm run cf:deploy`
  build + Cloudflare Worker deploy

Ha a merch oldalon `Unexpected token '<'` vagy `<!doctype html>` hiba jon a `/api/products` vegpontrol, akkor szinte biztosan HTML erkezik JSON helyett. Ez tipikusan akkor tortenik, ha:

- csak a statikus build fut
- `vite preview` alatt nezed a merch oldalt
- a deploy nem a Workerre megy, hanem csak asset hostolas tortent

## Helyes lokalis futtatas

```bash
npm install
npm run cf:dev
```

Ezutan ellenorizd:

```bash
curl http://127.0.0.1:8787/api/health
curl http://127.0.0.1:8787/api/products
```

Mindkettonek JSON-t kell visszaadnia.

## Helyes deploy

```bash
npm run cf:deploy
```

Utana ellenorizd a publikus endpointokat:

```bash
curl https://<deployment-domain>/api/health
curl https://<deployment-domain>/api/products
```

Elvart eredmeny:

- `/api/health` -> JSON
- `/api/products` -> JSON

Ha a `/api/products` 500-at ad, akkor mar a Worker fut, csak a D1 adatbazis vagy a tablakszerkezet hibas.
Ha `<!doctype html>` jon vissza, akkor route/deploy problema van, nem React build problema.
