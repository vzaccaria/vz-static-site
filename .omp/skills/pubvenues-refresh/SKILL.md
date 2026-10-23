---
name: pubvenues-refresh
description:
  Aggiorna data/pubvenues/venues.json (pagina /tools/pubvenues) del sito
  vz-static-site. Verifica deadline, date, luoghi e ranking delle conferenze
  sulle fonti ufficiali, aggiunge le edizioni nuove, sostituisce le date stimate
  e aggiunge venue. Usa per "aggiorna le deadline", "refresh pubvenues",
  "aggiungi la conferenza X" o "controlla le date di Y".
---

# Refresh di `data/pubvenues/venues.json`

Il modello dati e le invarianti sono descritti in `docs/pubvenues.md`. Lo schema
è `data/pubvenues/schema/pubvenues-v1.schema.json`. Leggili prima di scrivere
una patch.

## Strumenti del repository

| Comando | Cosa fa |
|---|---|
| `npm run venues:stale` | Elenca le venue seguite da aggiornare, con il motivo: `no-open-deadline`, `estimated`, `stale-check` (verifica più vecchia di 60 giorni; si cambia con `-- --days N`). Con `-- --json` dà l'output per gli script. |
| `npm run venues:merge -- [--dry-run] <patch.json>...` | Applica le patch: valida l'intero documento risultante, elenca le modifiche, imposta `updated` alla data di oggi e scrive il file solo se è tutto valido. |
| `npm run venues:check` | Valida schema e invarianti. |
| `npx tsx --test test/pubvenues.test.ts` | Esegue i test del modello. |

**Non modificare `venues.json` a mano e non con script ad hoc.** Ogni modifica passa da una patch e da `venues:merge`.

Per leggere una venue:
`read data/pubvenues/venues.json?q=.venues[] | select(.key=="osdi")`.

## Formato della patch

Il file è un array JSON:

```json
[
  {
    "key": "osdi",
    "editions": [
      {
        "year": 2027,
        "name": "21st USENIX Symposium on Operating Systems Design and Implementation",
        "url": "https://www.usenix.org/conference/osdi27",
        "location": "Baltimore, MD, USA",
        "country": "US",
        "start": "2027-07-07",
        "end": "2027-07-09",
        "submissions": [
          {
            "track": "papers",
            "deadline": "2026-12-08",
            "notification": "2027-03-16",
            "url": "https://www.usenix.org/conference/osdi27/call-for-papers"
          }
        ],
        "checked": "2026-10-22",
        "source": "https://www.usenix.org/conference/osdi27/call-for-papers"
      }
    ]
  }
]
```

Come si applica una patch:

- **Key esistente:** i campi della venue presenti nella patch (`rankings`, `tags`, `url`, `note`…) sostituiscono quelli attuali.
- **Edizioni:** vengono inserite o aggiornate per `year`. Un'edizione nella patch **sostituisce per intero** quella dello stesso anno, quindi devi riportare anche i campi che non cambiano. Le edizioni degli altri anni restano come sono.
- **Key nuova:** viene creata una venue nuova, quindi la patch deve contenere tutti i campi obbligatori (`key`, `acronym`, `name`, `kind`, `category`, `tags`, `rankings`, `tracked`, `editions`).
  - `category` deve essere uno degli id già presenti in `categories`.
  - La key deve essere uno slug stabile che non collide con quelle esistenti. Per esempio `fse` è ACM FSE, mentre FSE/ToSC è `fse-tosc`; `sac` è ACM SAC, mentre Selected Areas in Cryptography è `sac-crypto`.

## Workflow

1. **Ambito.**
   - Se l'utente nomina delle venue, aggiorna quelle.
   - Altrimenti parti da `npm run venues:stale -- --json`. Ordine di priorità: `no-open-deadline`, poi `estimated`, poi `stale-check`.
   - Per richieste generiche ("aggiorna tutto"), mostra quante venue sono coinvolte e procedi.
2. **Ricerca, per ogni venue.**
   - Leggi l'entry attuale.
   - Cerca la prossima edizione: home dell'edizione e pagina della call for papers.
   - Fonti in ordine di preferenza:
     1. sito ufficiale dell'edizione o del publisher;
     2. per la crittografia, il calendario IACR (https://www.iacr.org/events/);
     3. solo come ripiego, aggregatori (sec-deadlines, ccfddl, WikiCFP). In quel caso scrivilo nel `note` della submission, per esempio `"Date from sec-deadlines; official site unreachable"`.
3. **Scrittura della patch.** Le regole sui dati sono qui sotto.
4. **Prova a secco.** Scrivi la patch in `/tmp/pubvenues-patch-<lotto>.json` ed esegui `npm run venues:merge -- --dry-run /tmp/pubvenues-patch-*.json`. Correggi gli errori di validazione.
5. **Merge vero.** Ripeti lo stesso comando senza `--dry-run`.
6. **Verifica.**
   - Esegui `npm run venues:check`, i test del modello e di nuovo `npm run venues:stale`, che deve mostrare solo i residui attesi.
   - Apri `http://localhost:4321/tools/pubvenues/?upcoming=1&group=none` nel browser e controlla le venue che hai aggiornato. Se il dev server non è attivo, lancia `npm run dev`.
7. **Report.**
   - Una tabella `venue | modifica | fonte | incertezze`.
   - Poi l'elenco delle venue rimaste senza deadline aperta, con il motivo (CFP non uscita, sito irraggiungibile…).
8. **Chiusura.**
   - Fai il commit in locale con un messaggio tipo `Refresh pubvenues: <elenco breve>`.
   - **Non fare push senza conferma esplicita**: un push su `main` pubblica il sito.

### Molte venue

Oltre circa 8 venue, dividi il lavoro in lotti da circa 8 e dai ogni lotto a un sottoagente:

- Ogni sottoagente riceve il percorso di questa skill e di `docs/pubvenues.md`, le key del suo lotto e il file di output `/tmp/pubvenues-patch-<lotto>.json`.
- I sottoagenti scrivono **solo** il proprio file di patch e lo verificano con `npm run venues:merge -- --dry-run <file>`.
- **Non** toccano `venues.json`.
- Il coordinatore esegue un unico merge di tutti i file, poi la verifica e il report.

## Regole sui dati

- **Mai inventare una data.** Una data o viene da una fonte verificata, oppure è una proiezione marcata `"estimated": true`.
- **Proiezioni.**
  - Se la CFP della prossima edizione non è uscita, aggiungi l'edizione con le submission dell'ultima edizione spostate di un anno (o del periodo della serie, per esempio LATINCRYPT ogni due anni).
  - Su ciascuna submission metti `"estimated": true` e niente `url`.
  - Non mettere `start`/`end` se non sono stati annunciati.
  - Quando la CFP esce, sostituisci l'edizione e togli `estimated`.
- **Edizioni passate.** Non cancellarle: si aggiunge l'anno nuovo. La pagina sceglie da sola quale edizione mostrare.
- **Round multipli.** Una submission per round, con `round` distinti ("Spring"/"Fall", "Cycle 1", "Issue 3"…) e la `notification` di quel round. Le issue di TCHES, ToSC e PoPETs sono round.
- **Track.** Di norma `papers`. Usa `posters`/`artifacts`/`workshops` solo per scadenze davvero separate.
- **Deadline estese.** Usa la data estesa e aggiungi `note: "Extended from YYYY-MM-DD"`.
- **Fuso orario.** Il default è AoE. Se la CFP indica un altro fuso, aggiungi `timezone`: `"UTC"`, `"UTC+01:00"` o un nome IANA come `"America/Los_Angeles"`.
- **Abstract registration.** Va in `abstract`, non in una submission separata.
- **Tracciabilità.** In ogni edizione verificata metti `checked` (la data di oggi) e `source` (l'URL letto).
- **Paese.** Quando `location` è nota, aggiungi `country` con il codice ISO 3166-1 alpha-2 del paese ospitante (`US`, `IT`, `JP`…). Il filtro per continente usa questo campo. Le edizioni senza `country` finiscono sotto "TBA". Il codice deve esistere in `countryContinents` (`src/data/pubvenues-model.ts`); se manca, `venues:check` fallisce e va aggiunto lì. Per gli eventi solo online, ometti `country`.
- **Ranking.**
  - CORE: `{"source":"CORE","value":"A*","year":2026,"url":"https://portal.core.edu.au/conf-ranks/<id>/"}` con l'edizione ICORE/CORE corrente (in `note` se serve, per esempio "ICORE2026").
  - h5: `{"source":"h5","value":<int>,"year":<anno GS>,"url":...}` **solo** se letto davvero da Google Scholar Metrics.
  - Patchare `rankings` sostituisce l'intero array: riporta anche le voci che non cambiano.
- **Venue da archiviare.** Una venue che non interessa più o che ha chiuso diventa `"tracked": false`. Non si cancella.

## Guardrail

- Nessuna modifica fuori da `data/pubvenues/venues.json`. Le modifiche a schema o codice sono un lavoro separato.
- Niente push senza conferma.
- Se una fonte ufficiale e un aggregatore danno date diverse, vince la fonte ufficiale. Segnala la discrepanza nel report.
