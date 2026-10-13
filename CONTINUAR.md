# Com continuar la feina en un altre ordinador

Data de l'última sessió: 2026-10-13

## Estat actual

- ✅ Recerca a GitHub feta: la base és [inexorabletash/jslogo](https://github.com/inexorabletash/jslogo) (Apache 2.0).
- ✅ Especificació aprovada: `docs/superpowers/specs/2026-10-13-entorn-logo-design.md`
- ✅ Pla d'implementació escrit: `docs/superpowers/plans/2026-10-13-entorn-logo.md` (10 tasques)
- ⏳ **Pendent:** revisar el pla i triar com executar-lo. Encara no hi ha codi de l'entorn.

## Decisions preses

| Tema | Decisió |
|---|---|
| Primitives | Anglès UCBLogo (`FD`, `RT`, `REPEAT`, `TO ... END`) |
| Interfície | Català |
| Accés | GitHub Pages, sense comptes; feina desada al navegador + fitxers `.lgo` |
| Execució | Editor amb «Executa» + línia d'ordres |
| Quadrícula | Configurable: 10, 20 o 50 passos (`?cel=`) |
| Base tècnica | Fork de jslogo sense modificar-lo (a `vendor/`) |

Mètode d'execució recomanat: **directe** (una sola sessió implementa les 10 tasques i un revisor
comprova el resultat al final), en lloc de subagents per tasca.

## Passos a l'altre ordinador

1. Instal·la [Git](https://git-scm.com/), [Node.js](https://nodejs.org/) (versió 22 o superior)
   i [Claude Code](https://claude.com/claude-code).
2. Clona el repositori:
   ```bash
   git clone https://github.com/tomeu-cd100/logo-aula.git
   cd logo-aula
   ```
3. Obre Claude Code dins la carpeta i escriu:
   > Llegeix `CONTINUAR.md`. Vull executar el pla `docs/superpowers/plans/2026-10-13-entorn-logo.md`
   > en mode directe, tasca per tasca.
4. En acabar cada sessió, desa i puja la feina:
   ```bash
   git add -A
   git commit -m "descripció del que s'ha fet"
   git push
   ```
5. Abans de començar en qualsevol ordinador: `git pull`.

## Fitxers

- `logo.png` — captura de referència de la disposició.
- `docs/superpowers/specs/` — què es construeix i per què.
- `docs/superpowers/plans/` — com es construeix, pas a pas, amb codi i proves.
