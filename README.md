# CSC3058 Architecture Notes

Static Svelte 5 + Vite rewrite of the CSC3058 revision notes, formula visualisers, labs, and mock test. KaTeX and the `Hurmit Nerd Font` are bundled locally for full offline use (`JetBrains Mono` is only a system fallback in the font stack).

## Project structure

```text
.
├── index.html                  # App shell + anti-flash theme script
├── vite.config.js              # Svelte plugin, `@` -> `src` alias, KaTeX woff2-only trim
├── CSC3058-Architecture-Notes.html  # Pre-built single-file copy of the notes
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
│   └── components/
│       ├── chrome/             # TabBar, Sidebar, StatusLine, CmdPalette, FinderModal, Modal, HelpModal, etc.
│       ├── content/            # BlockRenderer, QuestionCard, StepsList, ToolSlot, etc.
│       ├── pages/              # Home, Topic, Formulas, Labs, MockTest, Settings, Locked
│       └── tools/              # Interactive calculators, simulators, and labs
│                               #   ToolHost lazy-loads each tool; ToolShell is the shared layout
└── dist/                       # Build output (git-ignored)
```

Imports use the `@` alias for `src/` (e.g. `@/utils/math.js`).

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

The build output in `dist/` is fully static and can be served by any static file host.
