# AGENTS.md

scratch-paint is the costume and backdrop editor embedded in MistWarp's editor: React 16, Redux and paper.js. It is a fork of TurboWarp's paint editor, and scratch-gui pins it to a commit.

## Where code goes

- `src/containers/` are the connected components (`paint-editor.jsx`, `paper-canvas.jsx`, one per tool mode), and `src/components/` the presentational ones. `src/reducers/` holds the editor state.
- `src/helper/` is the paper.js drawing logic: tools, bitmap and vector conversion, selection, style. Tool behaviour belongs here, not in components.
- `src/playground/` is the standalone development page.

## Things that look safe to change but are not

- The editor runs inside scratch-gui, which owns the page. Keyboard shortcuts are scoped by the host, so never bind global listeners that assume the paint editor has focus.
- Bitmap and vector costumes round-trip through the VM. Check that an edited costume still saves, reloads and renders the same in the editor.
- Phone layouts and touch gestures (pinch, rotate, tap) are supported, so check pointer changes on touch as well as mouse.

## Checks

Install with `npm ci --legacy-peer-deps` (an old ESLint config has a peer conflict). CI runs `npm run unit` and the production build (`NODE_ENV=production npm run build`, which needs `NODE_OPTIONS=--openssl-legacy-provider` on Node 17+), plus `npm run check:conventions` on pull requests, which rejects code comments and em dashes in the lines you add. `npm run lint` runs with `--fix` and the existing code still has lint errors, so lint the files you touch rather than the whole repo. Visible changes need screenshots, plus a recording for interaction, in the PR.

## Working here

- The default branch is `develop`. This repo is a fork, so open PRs with `gh pr create -R MistWarp/scratch-paint --base develop`.
- To try a change in the editor, check this repo out next to scratch-gui and run `pnpm run link` there.
- No code comments: name things so the code explains itself. No em dashes anywhere.
- Never add `Co-Authored-By` or any AI or tool attribution to commits or PRs.
- READMEs are overviews. Documentation goes in MistWarp/docs (https://mistwarp.org/docs/).
