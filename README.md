# Koka sijas slodzes kalkulators

Latviešu valodā veidots lokāls Electron kalkulators, kas aprēķina vienkārši balstītas koka sijas vienmērīgi sadalītās slodzes kapacitātes novērtējumu, attēlo siju Three.js modelī un glabā aprēķinu vēsturi lokālā SQLite datubāzē.

> **Svarīgi:** aprēķins ir vienkāršots un nav konstrukciju projektēšanas sertifikācija. Tas nepārbauda novirzi, bīdi, pašsvaru, drošības koeficientus vai būvnormatīvu atbilstību. Reāliem projektiem nepieciešama kvalificēta speciālista pārbaude.

## Prasības

- Node.js 20.19+ vai 22.12+ (ieteicams pašreizējais LTS)
- npm
- Windows izstrādei Electron Forge `maker-squirrel` var prasīt Windows build rīkus

## Darbināšana

```powershell
npm install
npm start
```

Pirmajā palaišanā nepieciešama vietējā prototipa licence. Atveriet otru termināli projekta saknē:

```powershell
npm run license:install
npm run license:issue -- lietotajs@example.com
npm run license:api
```

Saglabājiet terminālī izvadīto vienreiz parādīto licences atslēgu, ievadiet to lietotnē kopā ar to pašu e-pastu. Licenču datubāze pēc noklusējuma atrodas `~/.timber-beam-calculator/license-dev.sqlite`; to var pārvietot ar `LICENSE_DB_PATH`. API klausās tikai uz `127.0.0.1:4318` (`LICENSE_API_PORT` maina portu). Lietotnes API URL var mainīt ar `LICENSE_API_URL`.

Šī ir **tikai vietējās izstrādes licences demonstrācija**, nevis droša vai attālināta produkcijas licencēšanas sistēma. Tā nepiedāvā kontu pārvaldību, revokāciju, autorizācijas pakalpojumu vai servera puses aizsardzību.

## Aprēķins un dati

- `W = B × H² / 6`
- `q = 8 × f × W / L²`
- Ievades: `L`, `B`, `H` metros; lieces stiprība `f` kPa (kN/m²); `q` tiek parādīts kN/m.
- Aprēķinu loģika un ievades validācija darbojas Electron galvenajā procesā. Rendererim pieejamas tikai tipizētas IPC metodes caur `contextBridge`.
- Aprēķinu vēsture tiek glabāta SQLite failā Electron `userData` direktorijā un nav nosūtīta uz tīklu.

## Pārbaudes

```powershell
npm test
npm run typecheck
```

Licenču API fokusa testi izmanto izolētu pagaidu SQLite datubāzi un nejauši izvēlētu lokālu portu.

## Izstrādes struktūra

- `src/main.ts`, `src/preload.ts` — Electron galvenais process un minimālais IPC tilts.
- `src/renderer/` — Vue 3 lietotāja saskarne un Three.js sijas modelis.
- `src/shared/calculation.ts` — aprēķina pamatloģika.
- `license-api/` — atsevišķs lokāls Node.js izstrādes licenču API un atslēgu izveides komanda.

Produkcijas licencēšanas infrastruktūra, identitātes pakalpojumi, instalētāju parakstīšana un automātiskā atjaunināšana nav iekļauti.
