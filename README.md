# CSC3058 Architecture Notes

Static Svelte 5 + Vite rewrite of the CSC3058 revision notes, formula visualisers, labs, and mock test. KaTeX and all fonts (`Hurmit Nerd Font` and `JetBrains Mono`) are bundled locally for full offline use.

## Project structure

```text
.
├── index.html                  # App shell + anti-flash theme script
├── src/
│   ├── main.js                 # Mounts App into #mount
│   ├── App.svelte              # Shell layout, router view, global Vim keybindings
│   ├── app.css                 # Tailwind v4 layers + bundled fonts + KaTeX + stylesheets
│   ├── assets/fonts/           # Offline Hurmit Nerd Font woff2 files
│   ├── styles/                 # Design tokens and component styles
│   ├── data/
│   │   ├── index.js            # Exports topics, chapters, formulas, labs, visualisers
│   │   ├── exam.js             # Exam dates, question types, review table
│   │   ├── formulas.js         # Formula sheet, key formulas, common mistakes
│   │   ├── fxDefs.js           # Interactive formula visualiser definitions
│   │   ├── labs.js             # Lab catalogue & help metadata
│   │   ├── mipsPresets.js      # Sample MIPS programs for the step-through simulator
│   │   ├── topics/             # Topic explanations (01..23 + overlays)
│   │   └── questions/          # Practice question banks (01..23 + overlays)
│   ├── stores/                 # Svelte 5 rune stores (app, router, vim, notify)
│   ├── utils/                  # Pure logic, MIPS/pipeline engines, SVG/math/layout helpers
│   └── lib/components/
│       ├── ui/                 # shadcn-svelte Dialog & Button components
│       ├── chrome/             # TabBar, Sidebar, StatusLine, CmdPalette, FinderModal, etc.
│       ├── content/            # BlockRenderer, QuestionCard, StepsList, ToolSlot, etc.
│       ├── pages/              # Home, Topic, Formulas, Labs, MockTest, Settings, Locked
│       └── tools/              # Interactive calculators, simulators, and labs + ToolHost
├── Dockerfile                  # Multi-stage Node build -> nginx static serve
├── nginx.conf                  # Gzip, static asset caching, SPA fallback
├── docker-compose.yml          # Service definition with ${PORT:-8080}
├── start.sh                    # Build and start container in background
└── stop.sh                     # Stop and remove container
```

## Development

```bash
npm install
npm run dev
```

Production build & local preview:

```bash
npm run build
npm run preview
```

## Docker

Start (default port `8080`):

```bash
./start.sh
```

Start on a custom port:

```bash
PORT=3000 ./start.sh
```

Stop:

```bash
./stop.sh
```
