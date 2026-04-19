# Reclamo Energia 2.0

Versione 2.0 del progetto con funnel wizard guidato, backend ordini persistente e generazione documento server-side.

## Stack
- Frontend: HTML/CSS/JS vanilla mobile-first
- Backend: Node.js + Express
- Storage: file JSON persistente (`data/orders.json`)
- PDF: PDFKit (generazione lato server)
- Checkout: Stripe opzionale (con fallback mock in locale)

## Avvio locale
```bash
npm install
npm run dev
```
App disponibile su `http://localhost:3000`.

## Variabili ambiente
- `PORT` (default `3000`)
- `BASE_URL` (default `http://localhost:3000`)
- `STORAGE_PATH` (default `data/orders.json`)
- `DOWNLOAD_DIR` (default `public/downloads`)
- `STRIPE_SECRET_KEY` (opzionale)
- `STRIPE_PRICE_ID` (opzionale)
- `STRIPE_WEBHOOK_SECRET` (opzionale)

Se Stripe non è configurato, il sistema usa un checkout mock per test end-to-end.

## Flusso ordine / checkout
1. L'utente compila il wizard in 4 step (`/wizard.html`).
2. `POST /api/orders` crea ordine server-side con ID persistente.
3. `POST /api/orders/:id/checkout` apre sessione Stripe o mock checkout.
4. Dopo pagamento, backend marca ordine `paid`, genera PDF server-side e salva testo PEC.
5. Pagina ordine (`/ordine.html`) mostra download PDF + testo PEC + recovery token.

## Generazione documenti
- Logica business in `src/services/documentService.js`
- Template testuale modulare (header cliente, blocco destinatario, dettagli pratica)
- Rendering PDF su server, mai nel browser

## Recovery
- Ogni ordine include `recoveryToken` persistente.
- Recupero con endpoint `GET /api/orders/recover/:token`.

## Estendibilità futura
- Aggiungere nuovi tipi pratica: aggiornare select wizard + mapping testo documentale.
- Aggiungere email transazionale: hook dopo stato `paid`.
- Migrare storage JSON -> DB SQL senza cambiare API pubbliche.
