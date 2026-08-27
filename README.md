# gitblocks

git, block by block — animated, isometric walkthroughs of what git commands
actually do. Like RxMarbles, but for git: commits are blocks that never move,
refs are tags that do, and every animation is a shareable, embeddable URL.

The visual language (paper/ink palette, pastel block families, schematic
redstone-style wires) is borrowed from the render pipeline of
[redstone-university](https://github.com/fielding/redstone-university).

## Animations

| page | teaches |
| :-- | :-- |
| `rebase` | replay, not move — copies, new hashes, the strays, the golden rule |
| `merge` | one new commit with two parents; nothing rewritten |
| `cherry-pick` | one commit's changes, without its branch (a one-commit rebase) |
| `reset` | move the branch pointer; commits are abandoned, not erased |
| `fast-forward` | a merge with nothing to merge — the pointer just slides |

## Structure

Pure static files, no build step. Works from `file://` or any static host.

- `gitblocks.js` / `gitblocks.css` — the shared engine (isometric renderer,
  step animations, ref tags, panel, embed mode)
- `vizzes/<name>.js` — one data file per animation: commits, steps, copy
- `<name>.html` — thin page: fonts + engine + data
- `embed-demo.html` — an animation iframed inline in a fake blog post

## Sharing & embedding

Every page takes `?step=N` to deep-link a step (the URL tracks your position
as you navigate). Append `?embed` for a bare widget suitable for iframes:

```html
<iframe src="https://<host>/rebase?embed&step=7" width="100%" height="460"></iframe>
```

## Development

Open any page directly, or serve the folder:

```
npx serve
```
