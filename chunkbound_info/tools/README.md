# chunkbound_info tools

Standard library only — no Pillow, nothing to `pip install`. All paths are
derived from the scripts' own location, so they work in a clone on another
machine.

Typical loop when adding a biome screenshot:

```bash
# 1. drop the screenshot at biome-sprites/screenshots/<mod>/<biome>.png
python tools/downsize_screenshots.py    # make the 240px tracked copy
python tools/build_biome_doc.py         # refresh the table
```

| File | What it does |
|---|---|
| `downsize_screenshots.py` | full-res screenshots → 240px copies for the doc |
| `build_biome_doc.py` | regenerates [BIOME_SPRITES.md](../BIOME_SPRITES.md) from the pack |
| `build_pot_compat.py` | generates the F&C ↔ FD cooking-pot compat recipes |
| `jars.py` | reads data/assets out of the mod jars; samples block texture colours |
| `minipng.py` | tiny PNG reader/writer (handles Minecraft's 4-bit indexed PNGs) |

---

## `downsize_screenshots.py`

Turns full-resolution biome screenshots into the small copies that
[BIOME_SPRITES.md](../BIOME_SPRITES.md) embeds.

```
biome-sprites/screenshots/<mod>/<biome>.png   in   ~8 MB, 1920x1080, NOT tracked in git
biome-sprites/shots/<mod>/<biome>.png         out  ~80 KB, 240x135,  tracked in git
```

```bash
python downsize_screenshots.py              # process anything out of date
python downsize_screenshots.py --force      # rebuild everything
python downsize_screenshots.py --width 480  # larger display copies
```

### Why it exists

Minecraft screenshots are ~8 MB each. At 212 biomes that is ~450 MB, which this
repo cannot carry — it already needs Git LFS for one mod jar to stay under
GitHub's limit. The 240px copies come to a few MB total, and a 16x16 sprite
only needs colour and silhouette anyway. So `screenshots/` is gitignored and
`shots/` is committed.

### Notes

- **Standard library only.** No Pillow, nothing to `pip install`. It has its own
  small PNG decoder, so it handles the 4-bit indexed PNGs Minecraft and mods
  ship as well as ordinary 8-bit RGB/RGBA.
- **Incremental.** A screenshot whose thumbnail is already newer is skipped, so
  re-running is cheap. Pure-Python decoding costs a few seconds per new image.
- **Guards against a real mistake:** if a file in `shots/` is far larger than a
  thumbnail should be, that means a full-res screenshot was dropped into the
  output folder instead of `screenshots/`. The script says so and rebuilds it
  rather than skipping it forever on the timestamp check. If that happens, move
  the image to `screenshots/<mod>/<biome>.png` and re-run.
- **Filenames are the biome id.** `screenshots/biomesoplenty/bayou.png` maps to
  `biomesoplenty:bayou`. A name that matches no registered biome will not appear
  in the table — the doc generator warns about those.

Interlaced PNGs and 16-bit-per-channel PNGs are not supported; neither is
produced by Minecraft or by normal screenshot tools.

---

## `build_biome_doc.py`

Regenerates [BIOME_SPRITES.md](../BIOME_SPRITES.md) by reading the pack, so the
table cannot drift from reality.

```bash
python build_biome_doc.py
```

- **Biome ids** come from `data/<mod>/worldgen/biome/*.json` inside the mod jars,
  not a hand-kept list — install or remove a mod and the table follows.
- **Current sprites** come from the CBResources resourcepack, copied to
  `biome-sprites/current/` at 4x. A 16x16 sprite is invisible at native size in
  a markdown viewer.
- **Biomes with no sprite** show emi_ores' real `missing.png`, extracted from the
  jar — the same checkerboard EMI displays in game.
- **Screenshots** are picked up from `biome-sprites/shots/<mod>/<biome>.png`.
- **Disabled biomes are flagged.** BWG's `config/biomeswevegone/world_generation.json`
  can switch biomes off; they stay registered, so EMI still lists them and they
  still need a sprite, but they never generate and cannot be screenshotted.
  Four are off in this pack.
- **Warns about orphan screenshots** whose filename matches no registered biome
  id — otherwise they would silently never appear in the table.

---

## `build_pot_compat.py`

Writes the cross-mod recipes that `letsdocompat` used to synthesise at runtime
through a `RecipeManagerMixin`, so that mod can stay disabled. Four conversions:

| From | To | Effect |
|---|---|---|
| `farm_and_charm:pot_cooking` | `farmersdelight:cooking` | F&C meals in FD's cooking pot |
| `farmersdelight:cooking` | `farm_and_charm:pot_cooking` | FD meals in F&C's pot |
| `farm_and_charm:crafting_bowl` | `create:mixing` | bowl recipes automatable in a basin |
| `farm_and_charm:mincer` | `kaleidoscope_cookery:millstone` | mincer recipes on KC's millstone |

```bash
python build_pot_compat.py    # rewrites CBTweaks/data/chunkbound/recipe/compat/
```

Re-run it after adding or removing any mod that ships recipes of those types;
the output is static, so it does not follow the mod list on its own. It clears
its previous output first, so it is safe to run repeatedly and never leaves
stale files — and it must clear before it reads tags, or the container entries
it wrote last time read back as already present.

- **Ids live in our own `chunkbound:` namespace.** letsdocompat reuses the source
  recipe's id, which is what produces EMI's "2 recipes loaded with the same id"
  errors. These do not collide with anything.
- **Every file is gated** on `neoforge:mod_loaded` for both the source mod and
  the target mod, so removing either one disables the recipe instead of leaving
  a broken one.
- **Colliding conversions are skipped and listed.** All four types are modded, so
  Polymorph does not arbitrate them and a clash would silently make one recipe
  unobtainable. Each converted recipe is fed back into the index as it is
  written, so the check catches collisions *between two conversions* as well as
  against the mods' own recipes.
- **The millstone check is per input item, not per ingredient set.** It grinds one
  item at a time, so two recipes conflict the moment their ingredients *overlap* —
  comparing whole ingredient lists the way the pot and basin checks do would miss
  a tag that merely intersects another. That is what catches `cornmeal`, whose
  `#cornexpansion:seeds/corn` input shares `farm_and_charm:kernels` with KC's
  `oil_from_seeds` (`#c:seeds`). Any input still claimed twice after generation
  is printed as a WARNING, including clashes between the mods' own recipes.
- **FD recipes with no explicit `container` are skipped and listed.** FD fills an
  omitted container from the result item's crafting remainder in code, which a
  datapack cannot read, and F&C stores the container verbatim with no fallback —
  converting them anyway would let the F&C pot serve a bowl of stew without
  spending a bowl. 25 recipes sit in this bucket, `beef_stew` among them.
- **Containers get added to `#farm_and_charm:container`** when a converted recipe
  needs one the tag lacks; F&C's block entity validates the container slot
  against that tag in code.
- **Non-grinding mincer recipes stay mincer-only.** A millstone grinds, so
  slicing a melon, cutting bacon or stripping a log has no business on one.
  `MILLING_SKIP_NAMES` and the `stripped_` prefix hold that list — 27 recipes.
  Editing that constant is the "the mincer may still do it, the millstone may
  not" lever; putting `neoforge:false` on the mincer recipe itself is the
  "nobody does it" lever, and the generator will then drop the millstone copy
  too on its next run, since it reads live recipes with overrides applied.
- **letsdocompat never had this route.** Its millstone converter targeted Create
  and was never registered in `RECIPE_CONVERSION_MAP`, so it never ran at all.

---

`jars.py` finds the vanilla client jar automatically (CurseForge and vanilla
launcher layouts). Set `MC_CLIENT_JAR` to point at it directly. Everything here
works without it; only vanilla block-colour sampling needs it.
