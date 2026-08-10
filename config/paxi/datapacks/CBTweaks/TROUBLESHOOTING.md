# Pack Notes & Gotchas

Hard-won findings from working on this pack. Most of these cost real debugging
time, and several fail **silently** — read before assuming something is broken.

---

## The big one: KubeJS beats datapacks

`ServerEvents.tags` runs **after** datapacks finish loading. A script
`event.add()` silently overwrites a datapack `remove`, with no error and no
warning.

Symptom seen here: `farm_and_charm:tomato` kept reappearing in `c:crops/tomato`,
`c:foods`, `c:vegetables` and others, no matter what the datapack said. The
cause was one line in a KubeJS script re-adding it every load.

**Before writing a tag override, grep `kubejs/` for the item.** If a script
touches the same tag, fix the script — the datapack cannot win.

```bash
grep -rn "namespace:item_id" kubejs/ | grep -vE ":[0-9]+:\s*//"
```

---

## Tags

**Paths fail silently.** A tag must live at
`data/<namespace>/tags/<registry>/<name>.json`. We had `data/origins/meat.json`
— missing the `tags/item/` segment — which Minecraft simply never read. No
error, no warning, the removal just didn't happen. If a tag override "doesn't
work", check the path first.

**NeoForge defines `c:` tags too.** Not just mods. `c:foods/raw_meat` and
`c:drinks/milk` both come from the loader. Scanning only `mods/*.jar` gives
wrong answers — twice here it led to a false "that tag doesn't exist"
conclusion. Include `.probe/source_jars/neoforge-*-sources.jar` in tag scans.

**Some mods use the legacy plural path.** `tags/items/` instead of 1.21's
`tags/item/` — letsdocompat and a few others. Mirror the source file's exact
path so the override lines up either way.

**Resolve transitively when hunting an item.** Mozzarella looked like one direct
reference; it was actually reachable by nine recipes through
`candlelight:cheeses` → `c:cheeses` and `cornexpansion:cheese` → `c:cheeses`.
Follow `#tag` entries recursively or you will miss most usages.

**`remove` is a NeoForge extension.** Include `"values": []` alongside it —
vanilla's codec expects a `values` key.

**Identical tags confuse recipe viewers.** When two tags contain exactly the
same items, EMI may label an ingredient with either name. `c:crops/cabbage` and
`c:foods/cabbage` both resolve to the same two items, so a recipe using
`foods/cabbage` can display as `crops/cabbage`. That is cosmetic, not a bug.

---

## Recipes

**Disabling a recipe: use a condition, not `{}`.**

```json
{ "neoforge:conditions": [ { "type": "neoforge:false" } ] }
```

An empty `{}` also disables the recipe but logs a parse error every launch (28
of them, here). NeoForge's `ConditionalOps` returns
`DataResult.success(Optional.empty())` *before* it ever parses the body, so with
a false condition no `type` field is needed and nothing is logged.

**`{}` is fine for loot tables**, though — every field in a loot table is
optional, so it parses as an empty table and drops nothing, silently.

**Result keys differ by recipe type.** Getting this wrong throws
`No key id in MapLike[...]` or `No key item in MapLike[...]`:

| Recipe type | Result shape |
|---|---|
| `farm_and_charm:pot_cooking` | `"result": { "id": "...", "count": 1 }` |
| `farmersdelight:cutting` | `"result": [ { "item": { "id": "...", "count": 1 } } ]` |

**`forge:` tags are dead on NeoForge 1.21.** `forge:tools/knives` is defined by
nothing, so a recipe using it can never be crafted — and it does *not* error,
because an undefined tag is just empty. Use `c:` equivalents (`c:tools/knife`).

**Matching a water bottle** needs a component ingredient, since `minecraft:potion`
alone accepts every potion:

```json
{ "type": "neoforge:components", "items": "minecraft:potion",
  "components": { "minecraft:potion_contents": { "potion": "minecraft:water" } } }
```

This works wherever the recipe uses the vanilla `Ingredient` codec — check the
serializer references `Ingredient.CODEC` or `CODEC_NONEMPTY` before relying on it.

**Some recipes cannot be overridden at all.** letsdocompat ships *zero* recipe
files and synthesises them at runtime via a `RecipeManagerMixin`. Its broken
`simple_tomato_soup` cannot be fixed by any datapack; it needs a mod update.

---

## Loot tables

**`random_chance_with_looting` was removed in 1.21.** Any loot modifier still
using it fails to load, so its drops silently never happen — seven Dungeons
Delight items were dropping at a rate of zero. Convert to:

```json
{ "condition": "minecraft:random_chance_with_enchanted_bonus",
  "unenchanted_chance": <chance>,
  "enchanted_chance": { "type": "minecraft:linear",
                        "base": <chance + multiplier>,
                        "per_level_above_first": <multiplier> },
  "enchantment": "minecraft:looting" }
```

`base = chance + multiplier` — confirmed against vanilla's own
`entities/drowned.json` in the 1.21.1 client jar.

**Double-tall plants lose tool context.** Breaking either half destroys the
other as a knock-on, and *that* removal carries no tool and no breaking entity.
So a `half: lower` gate can never see your shears when you break the top half.
Gate on the player instead, and drop the half condition entirely:

```json
{ "condition": "minecraft:entity_properties", "entity": "this",
  "predicate": { "type": "minecraft:player" } }
```

The knock-on removal has no entity, so it yields nothing — exactly one drop from
either half, with the tool correctly detected. Trade-off: explosions and pistons
then drop nothing.

**Every `global_loot_modifiers.json` entry needs a real file.** A dangling
`cbtweaks:seed_swapper` entry errored on every launch for a modifier that never
existed.

---

## KubeJS

**Zero-arg Java methods are properties in Rhino.** `SceneBuildingUtil.select()`
is `util.select`, not `util.select()`. Calling it throws
`TypeError: Cannot call property select ... it is not a function`. Same applies
to `util.vector` and `util.grid`.

**Script load ≠ script run.** The Ponder error above logged
`3/3 scripts loaded, 0 errors` at startup and only threw hours later when a
scene was opened. A clean startup log does not mean a script is correct.

**Changing food properties** is `ItemEvents.modification` in `startup_scripts/`
(food is an item component in 1.21, not datapack-editable). Use `modifyFood`,
not `setFood`, to keep the existing nutrition and saturation:

```js
event.modify('candlelight:lasagne', item => {
  item.modifyFood(food => food.effect('farmersdelight:comfort', 4800, 0, 1.0))
})
```

**Check whether a script block is even live.** Three server scripts here were
100% commented out, so deleting them changed nothing — but the tags they *used*
to manage had no datapack replacement either. Verify with:

```bash
git show HEAD:path/to/script.js | grep -vE "^\s*//" | grep -cvE "^\s*$"
```

---

## Resource packs (CBResources)

**Ponder structures are assets, not data.** They live at
`assets/<ns>/ponder/<name>.nbt` and are replaced by a *resource* pack. PonderJS
falls back to `ponderjs:basic` (a 5×10×5 structure, floor at y=0) unless a scene
passes one explicitly via the four-argument
`scene(id, title, structureId, storyboard)` overload.

**Lang files merge per key.** Adding
`assets/<othermod>/lang/en_us.json` with a single key does *not* wipe that mod's
other translations — `ClientLanguage` folds every pack's file into one map. Safe
to add one key under another mod's namespace.

**EMI effect descriptions** come from `effect.<namespace>.<id>.description`
(emiffect falls back to `.desc`). Without one it shows
*"The effect appears to have no descriptions..."*.

**Tag display names** come from `tag.item.<namespace>.<path>`, dots replacing
`:` and `/`.

**Resource packs need a restart or F3+T** — `/reload` does not pick them up.

---

## Effects

**Read the category from bytecode, never the name.** Each effect class's
constructor passes a `MobEffectCategory`. Several mods mix all three in one
registry, and Kaleidoscope Cookery registers *everything* as BENEFICIAL because
its `BaseEffect(int)` constructor hardcodes it — including Hinder and Flatulence.

**Effect ids come from the ProbeJS dump**, which is the only complete list:
`.probe/@special/types/index.d.ts`, the `type MobEffect = ...` union. 152 here.

See [BENEFICIAL_EFFECTS.md](BENEFICIAL_EFFECTS.md) for the compiled results.

---

## Repo conventions

**Non-JSON files in a datapack are harmless.** Verified two ways: the shipped
`MSD item pack` zip contains `readme.txt` and `chud.jpeg` at its root and loads
fine, and this pack launched cleanly with `BENEFICIAL_EFFECTS.md` present.
Minecraft only reads `pack.mcmeta`, `pack.png` and `data/`; loaders filter to
`.json` anyway — mods even ship `.js` and `.zs` files inside `data/`.

**Runtime config is untracked.** Mods rewrite their own config every launch, so
`config/attributefix/`, `xaero`, `relics`, `sodium-options.json` and friends are
gitignored. `emi.json`, `minecraftinstance.json` and `options.txt` stay tracked
but perpetually dirty — leave them uncommitted.

**Never keep two copies of the same datapack file.** `kubejs/data/` and
CBTweaks both had `kaleidoscope_cookery/loot_table/chest/village_chest.json`;
whichever loaded last silently won, and they had drifted apart. All datapack
content now lives in CBTweaks.

---

## Useful investigation commands

```bash
# what actually defines / contributes to a tag (include NeoForge!)
for j in mods/*.jar; do unzip -p "$j" "data/c/tags/item/foods/onion.json" 2>/dev/null \
  && echo "  ^ $j"; done
unzip -p .probe/source_jars/neoforge-*-sources.jar "data/c/tags/item/foods/onion.json"

# an effect / recipe class's real behaviour
javap -p -c -constants -cp mods/<mod>.jar <fully.qualified.Class>

# vanilla reference data (loot tables, tags) - authoritative for 1.21.1
unzip -p "$MC_INSTALL/versions/1.21.1/1.21.1.jar" data/minecraft/loot_table/entities/drowned.json

# group launch errors by cause instead of reading 600 lines
grep "Parsing error loading recipe" logs/latest.log \
  | sed -E 's/.*JsonParseException: //' | sort | uniq -c | sort -rn
```
