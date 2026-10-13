# LOGO a l'aula

Entorn web per programar en LOGO (primitives UCBLogo en anglès, interfície en català).
Basat en [jslogo](https://github.com/inexorabletash/jslogo) de Joshua Bell (Apache 2.0).

## Per a l'alumnat

Obre l'enllaç que t'ha donat el docent. La feina es desa sola en aquest navegador;
per endur-te-la a un altre ordinador, fes servir **💾 Desa .lgo** i **📂 Obre .lgo**.

## Per al docent

### Enllaç amb mida de quadrícula

Afegeix `?cel=10`, `?cel=20` o `?cel=50` a l'enllaç perquè cada cel·la valgui
aquests passos. Exemple: `https://USUARI.github.io/REPO/?cel=10`

### Publicar a GitHub Pages

1. Crea un repositori a GitHub i puja-hi aquesta carpeta (`git push`).
2. Al repositori: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branca `main`, carpeta `/ (root)`.
3. En un o dos minuts l'entorn és a `https://USUARI.github.io/REPO/`.

### Provar en local

```bash
npm install
npx playwright install chromium
npm start        # http://localhost:8123
npm test         # proves unitàries i de navegador
```

### Actualitzar jslogo

Torna a copiar `logo.js`, `turtle.js`, `floodfill.js` i `cm/` del repositori de jslogo
a `vendor/jslogo/`, actualitza el commit a `NOTICE` i executa `npm test`.
