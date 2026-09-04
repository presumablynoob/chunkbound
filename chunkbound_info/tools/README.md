# chunkbound_info tools

Standard library only — no Pillow, nothing to `pip install`. All paths are
derived from the scripts' own location, so they work in a clone on another
machine.

| File | What it does |
|---|---|
| `build_pot_compat.py` | generates the F&C ↔ FD cooking-pot compat recipes |

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
