# Wix beillesztes - 2 landing oldal

Ez a mappa ket kesz landing oldalt tartalmaz:

- `offline-ai-landing.html`
- `napelem-landing.html`

## 1) Gyors opcio: kulso host + Wix iframe

1. Toltsd fel a HTML fajlokat es az image mappakat egy statikus hostingra (pl. Netlify, Vercel static, GitHub Pages).
2. Wix oldalon: Add Elements -> Embed Code -> Embed a Widget.
3. URL modban add meg a hosted oldalt, pl:
   - `https://sajat-domain.hu/landing/offline-ai-landing.html`
   - `https://sajat-domain.hu/landing/napelem-landing.html`
4. Allitsd a widget szelesseget 100%-ra, minimum magassag: 3200-4200 px.

## 2) Beillesztes kozvetlenul Wix HTML embedbe

1. Nyisd meg a valasztott HTML fajlt.
2. Masold a teljes tartalmat.
3. Wix: Add Elements -> Embed Code -> Embed HTML.
4. Illeszd be a teljes HTML kodot.

Megjegyzes: egyes Wix temak/szabalyok a script vagy kulso font betoltest korlatozhatjak. Ha ilyet latsz,
- vedd ki a Google Font linkeket, es hasznalj rendszer fontot,
- vagy hasznald inkabb az 1) opciot (hostolt iframe), mert az stabilabb.

## Kepek cserelese

A ket oldal jelenleg helyi keputvonalakat hasznal:

- `../extracted_images/...`
- `../extracted_images_napelem/...`

Ha hostolod, ezek maradjanak relativ utak. Ha Wix-be direkt kodot masolsz, csereld oket Wix Media URL-ekre.

## Tobbnyelvu/brand testreszabas

A cserelendo elemek:

- hero cim es alcim
- KPI ertekek
- CTA gomb szovegek es linkek
- kapcsolat email
