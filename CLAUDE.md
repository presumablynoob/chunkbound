# Chunkbound

A NeoForge 1.21.1 Minecraft modpack instance. Most work here is **datapack and
resourcepack editing** to unify overlapping content between food/farming mods
(Farm & Charm, Farmer's Delight, Candlelight, Kaleidoscope Cookery, Bakery,
Brewin' & Chewin', Cornexpansion, Dungeons Delight).

## Where things live

| Path | What it is |
|---|---|
| `config/paxi/datapacks/CBTweaks/` | The pack's datapack. All recipe/tag/loot overrides go here. |
| `config/paxi/resourcepacks/CBResources/` | The pack's resourcepack. Textures, lang, ponder structures. |
| `kubejs/startup_scripts/` | Item component edits (food effects, stack sizes) — not datapack-able. |
| `kubejs/client_scripts/` | Lang renames and Ponder scenes. |
| `kubejs/server_scripts/` | Runtime tag/recipe edits. **Prefer a datapack over adding here.** |
| `mods/` | Mod jars — the source of truth for what a mod actually does. |

Overriding a mod's file means recreating its exact path under
`CBTweaks/data/<namespace>/...`. Read the original out of the jar first.

## Non-negotiables

1. **Check `kubejs/` before writing a tag override.** `ServerEvents.tags` runs
   *after* datapacks, so a script `event.add()` silently beats a datapack
   `remove`. This has already caused one long debugging session.
2. **Verify against the jars, don't infer from names.** Read the actual recipe,
   tag, loot table or class before changing it. Several assumptions in this repo
   turned out backwards when checked.
3. **Include NeoForge when scanning tags.** It defines many `c:` tags itself
   (`c:foods/raw_meat`, `c:drinks/milk`). A `mods/*.jar`-only scan gives wrong
   answers — see `.probe/source_jars/neoforge-*-sources.jar`.
4. **Many failures are silent.** Wrong tag path, `forge:` namespace tags, and
   removed 1.21 loot conditions all fail with no error. Absence of a log error
   does not mean it works.
5. **Disable recipes with a condition, not `{}`** —
   `{"neoforge:conditions":[{"type":"neoforge:false"}]}` — `{}` logs a parse
   error every launch.
6. **Datapacks need a world reload; resourcepacks need a client restart** (or
   F3+T). `/reload` does not pick up resourcepack changes.

## Git

- `main` is the working branch. Commit and push only when asked.
- `emi.json`, `minecraftinstance.json` and `options.txt` are tracked but
  rewritten every launch — leave them dirty, never commit them.
- Per-mod runtime config (`config/attributefix/`, `xaero`, `relics`, …) is
  gitignored and untracked on purpose.
- `.gitignore` is whitelist-style: everything under `/` is ignored unless
  explicitly `!`-listed. New root files need an entry.

## Full findings

Read this before debugging anything — it covers tags, recipes, loot tables,
KubeJS, resourcepacks, effects, and the investigation commands that work here:

@config/paxi/datapacks/CBTweaks/TROUBLESHOOTING.md
