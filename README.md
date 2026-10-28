# alfred

A local-first dashboard for independent work: projects, time tracking, tasks, outreach, income, invoices, quotes, and achievement streaks.

## Run

Open `index.html` in a browser, or serve the directory:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Features

- Project accordions and a persistent project timer with pause/resume and manual time entries.
- Tasks, notes, achievement badges, and tracked-time streaks.
- Prospect statuses, follow-ups, and editable English/French outreach drafts for businesses with or without websites.
- Optional public website checks through PageSpeed Insights, with an external-report fallback.
- Invoice and quote records, quote-to-invoice conversion, and partial/full payment tracking.
- Monthly income summaries, configurable goals, and an all-time overview.
- Local clock, optional city weather, reveal animations, and locally bundled Lenis scrolling.

## Data and privacy

This repository starts empty, apart from the generic Business workspace. No personal clients, tasks, earnings, prospects, invoices, time records, goals, location, or exported backups are included.

Workspace records stay in the current browser’s localStorage under `alfred-workspace-v1`. They are not committed to Git or synced to GitHub. The sidebar export button downloads a backup; keep backups outside the repository. Browser storage is not an encrypted backup or a multi-user account system.

The clock uses the browser timezone. Weather has no preset location: choose a city to enable it. City searches and weather requests use Open-Meteo; website checks send the entered public URL to Google PageSpeed Insights. These services require an internet connection. No API keys are bundled.

Outreach drafts are assembled locally from the supplied inputs and observations. Nothing is sent to prospects automatically. Invoice/quote templates and branded PDF export can be added later; the current interface manages records and payments.

## Assets and dependencies

Brand and achievement artwork is included in `alfred-logo.svg` and `alfred-assets/`. Generated PNGs have ancillary metadata removed. Lenis 1.3.24 is bundled locally; see `alfred-assets/LENIS-LICENSE.txt`. The Feather icon attribution is preserved in `index.html`. Literary quotations retain source links.

## Checks

```sh
node tests/smoke.cjs
```
