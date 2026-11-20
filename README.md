# CSC3058 Architecture Notes

An interactive revision notebook for **CSC3058 Advanced Computer Architecture** (Queen's University Belfast). It covers the lectures topic by topic, with worked examples, practice questions, formula visualisers, hands-on labs and a timed mock test, and it works fully offline.

Built with Svelte 5 and Vite. Lecture content follows Patterson & Hennessy, *Computer Organization and Design* (MIPS edition).

## What's inside

| Section | What it gives you |
| --- | --- |
| **Topics** (23) | One page per topic, grouped by textbook chapter: key points, step-by-step worked examples, common traps and practice questions with revealable answers. |
| **Formulas** | The formula sheet (iron law, Amdahl's law, power, CPI with stalls, AMAT …) with interactive visualisers and a list of common mistakes. |
| **Labs** | Number lab, MIPS step-through simulator, pipeline simulator, single-cycle datapath, instruction encoder, dependency finder, hazard drill, branch predictors, clock drill and more. |
| **Mock test** | A timed paper in the style of the class test, weighted like the official Practice Test. |
| **Exam info** | Key dates, test weights and scope, question types seen so far, and the review-session checklist. |

### Topics covered

| Ch. | Topics |
| --- | --- |
| 1. Abstractions & technology | Trends and the power wall · von Neumann model, ISA vs microarchitecture · performance · CPU performance equation · Amdahl's law |
| 2. Instructions | MIPS registers and memory · R/I/J formats · branches, procedures, addressing modes · compile, assemble, link, load · binary and two's complement |
| 3. Arithmetic | Floating point (IEEE 754) |
| 4. The processor | Microarchitecture basics · single-cycle datapath · multi-cycle · pipelining · structural, data and control hazards · forwarding and reordering · ILP and multiple issue |
| 5. Memory hierarchy | Caches · cache performance · virtual memory |

Lectures that have not been written up yet show as locked placeholders in the sidebar, with the lecture title from the Canvas plan.

## Keyboard

The app is built to be driven from the keyboard with Vim-style keys. Press `?` in the app for the full list.

| Keys | Action |
| --- | --- |
| `Space` | Leader menu |
| `/` | Search topics, formulas, labs and questions |
| `j` `k` · `gg` `G` · `Ctrl+d` `Ctrl+u` | Move and scroll |
| `]]` `[[` | Next / previous heading |
| `L` `H` | Next / previous topic |
| `za` `zM` `zR` | Toggle, close or open folds |
| `Enter` | Reveal an answer, follow a link, open a fold |
| `x` | Mark the question under the cursor as attempted |
| `:` | Command line, e.g. `:e 5`, `:set bg=dark` |

Mouse and touch work too. Progress and settings are stored in your browser.

## Running it

Open `CSC3058-Architecture-Notes.html` directly in a browser for a single-file copy with no install. It may lag behind the source.

To run from source (Node 20+):

```bash
npm install
```

```bash
npm run dev
```

To build the static site into `dist/` and preview it:

```bash
npm run build && npm run preview
```

`dist/` is fully static and can be served by any static host. KaTeX and the Hurmit Nerd Font are bundled, so nothing is loaded from the network.

## Project structure

```text
.
├── index.html                  # App shell + anti-flash theme script
├── vite.config.js              # Svelte plugin, `@` -> `src` alias, KaTeX woff2-only trim
├── CSC3058-Architecture-Notes.html  # Pre-built single-file copy of the notes
└── src/
    ├── main.js                 # Mounts App into #mount
    ├── App.svelte              # Shell layout, router view, global Vim keybindings
    ├── app.css                 # Fonts, KaTeX and stylesheets
    ├── assets/fonts/           # Offline Hurmit Nerd Font woff2 files
    ├── styles/                 # Design tokens and component styles
    ├── data/                   # All course content (see below)
    ├── stores/                 # Svelte 5 rune stores (app, router, vim, notify)
    ├── utils/                  # Pure logic, MIPS/pipeline engines, SVG/math/layout helpers
    └── components/
        ├── chrome/             # TabBar, Sidebar, StatusLine, CmdPalette, FinderModal, HelpModal …
        ├── content/            # BlockRenderer, QuestionCard, StepsList, ToolSlot …
        ├── pages/              # Home, Topic, Formulas, Labs, MockTest, Settings, Locked
        └── tools/              # Interactive calculators, simulators and labs
                                #   ToolHost lazy-loads each tool; ToolShell is the shared layout
```

Imports use the `@` alias for `src/` (e.g. `@/utils/math.js`).

## Adding or updating content

All content is plain JavaScript data in `src/data/`, so updating the notes rarely needs component changes.

| File | Holds |
| --- | --- |
| `topics/NN-name.js` | A topic page: title, lectures covered, sections, worked steps, traps |
| `questions/NN-name.js` | That topic's practice questions and answers |
| `topics/overlays.js`, `questions/overlays.js` | Corrections and additions layered on top of the base files |
| `exam.js` | Key dates, test info, question types, review table, and `LOCKED` (lectures not yet written up) |
| `formulas.js`, `fxDefs.js` | Formula sheet, common mistakes and visualiser definitions |
| `labs.js`, `mipsPresets.js` | Lab catalogue and sample MIPS programs |
| `index.js` | Wires topics and question banks together |

To add a lecture: create the topic and question files, import them in `src/data/index.js`, add the topic number to its chapter in `CHAPTERS`, and remove the lecture from `LOCKED` in `exam.js`.

Sources are cited inline: slide refs such as `L10 s16`, transcript times such as `R1 Part III [8:20]`, and official material such as `PS2 Q4a` or `Practice Test Q5`.

## Disclaimer

These are personal study notes, not official course material. Check anything important against the lecture slides and Canvas.
