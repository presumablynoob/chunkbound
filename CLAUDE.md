# Chunkbound

A NeoForge 1.21.1 Minecraft modpack instance. Most work here is **datapack and
resourcepack editing** to unify overlapping content between food/farming mods
(Farm & Charm, Farmer's Delight, Candlelight, Kaleidoscope Cookery, Bakery,
Brewin' & Chewin', Cornexpansion, Dungeons Delight).

Everything below is a hard-won finding from working on this pack. Several of
these failure modes are **completely silent** — read before assuming something
is broken, and before assuming something works.

## Where things live

| Path | What it is |
|---|---|
| `config/paxi/datapacks/CBTweaks/` | The pack's datapack. All recipe/tag/loot overrides go here. |
| `config/paxi/resourcepacks/CBResources/` | The pack's resourcepack. Textures, lang, ponder structures. |
| `kubejs/startup_scripts/` | Item component edits (food effects, stack sizes) — not datapack-able. |
| `kubejs/client_scripts/` | Lang renames and Ponder scenes. |
| `kubejs/server_scripts/` | Runtime tag/recipe edits. **Prefer a datapack over adding here.** |
| `mods/` | Mod jars — the source of truth for what a mod actually does. |
| `chunkbound_info/` | Pack documentation and its tooling. Not loaded by the game. |

Overriding a mod's file means recreating its exact path under
`CBTweaks/data/<namespace>/...`. Read the original out of the jar first.

## Working rules

1. **Verify against the jars, don't infer from names.** Read the actual recipe,
   tag, loot table or class before changing it. Several assumptions in this repo
   turned out backwards when actually checked.
2. **Absence of a log error does not mean it works.** Wrong tag paths, `forge:`
   namespace tags, and removed 1.21 loot conditions all fail with no output.
3. **Datapacks need a world reload; resourcepacks need a client restart** (or
   F3+T). `/reload` does not pick up resourcepack changes.

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

**An override file at the path does not mean *your* item is handled.** CBTweaks
tag files are `remove` lists that merge with the jar's values, so
`data/c/tags/item/seeds.json` existing says nothing about whether
`kaleidoscope_cookery:wild_rice` is still in `c:seeds`. Checking "is there an
override?" reports false negatives. Always resolve the merged tag: feed every
jar's values, then apply CBTweaks' `values`/`remove` in load order, and inspect
the result. Same for recipes and loot — read the CBTweaks file when one shadows
the jar path, and skip anything containing `neoforge:false`.

**Identical tags confuse recipe viewers.** When two tags contain exactly the
same items, EMI may label an ingredient with either name. `c:crops/cabbage` and
`c:foods/cabbage` both resolve to the same two items, so a recipe using
`foods/cabbage` can display as `crops/cabbage`. That is cosmetic, not a bug.

**A broken biome tag does not necessarily stop worldgen.** medieval_buildings
lists 12 Terralith biomes plus a misspelled `biomeswevegone:skyrise_vale` (the
real id is `skyris_vale`) as *required* entries in its four
`has_structure/*` tags, so KubeJS logs `Couldn't load tag ... missing following
references` and vanilla follows with `Not all defined tags ... are present in
data pack`. Those two messages look conclusive. They are not — the structures
still generate, most likely because Structurify's `StructureMixin` wraps
`Structure.biomes()` and resolves the biome set itself. Do not infer "this never
spawns" from tag errors; **check in game before writing a fix or a bug report.**
An override for such a tag needs `"replace": true`, since a merging override
leaves the broken entries in place and the tag still fails.

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

**A plausible-looking `c:` tag can be undefined too.** Cultural Delights asks
for `c:foods/milk` in four cooking recipes; nothing in this pack defines that
path, so all four were uncraftable in silence. The live tag is `c:drinks/milk`
(NeoForge, FD and Cobblemon all contribute), resolving to
`minecraft:milk_bucket`, `farmersdelight:milk_bottle` and
`cobblemon:moomoo_milk` — and FD's own soups use it. Overrides live under
`data/culturalrecipes/`, **not** `culturaldelights/`: the mod id and its data
namespace differ. Dungeons Delight has the same bug in three recipes, left alone
because all three are gated on `neoforge:mod_loaded: twilightforest`, which is
not installed.

When an ingredient tag moves from empty to populated it can collide with another
recipe of the same type, which for a modded type is silent — resolve every
recipe of that type to concrete item sets and compare before shipping the fix.

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

**Polymorph makes vanilla crafting conflicts harmless.** Two recipes with the
same crafting-grid input normally mean first-match-wins and the loser becomes
uncraftable. This pack ships `polymorph`, which shows a picker so the player
chooses which result to take. Retargeting an ingredient onto a shape another mod
already uses is therefore fine — e.g. `kaleidoscope_cookery:straw_block` and
`farmersdelight:rice_bale` are both a 3×3 of `farmersdelight:rice_panicle`, and
both stay obtainable.

Still **report a conflict when you create one** — it is a real change to how
crafting feels, just not a blocker. Say which recipes collide and that Polymorph
resolves it.

**This only covers `minecraft:crafting_shaped` and `minecraft:crafting_shapeless`.**
Polymorph does not arbitrate modded recipe types — a cooking pot, millstone,
stockpot, cutting board or similar picks one match with no player choice, so a
collision there *does* silently make a recipe unobtainable. Always check for
same-type collisions before retargeting an ingredient, and warn about those.
Group by recipe `type` when checking; two recipes sharing an ingredient are only
in conflict if they are the same type.

**`recipes/` (plural) is not a recipe folder.** 1.21 reads
`data/<ns>/recipe/`. Miner's Delight ships its Create integration at
`data/minersdelight/recipes/create/filling/…`, so those four filling and
emptying recipes have never loaded — no error, they are simply invisible to the
recipe manager. Check the path before "fixing" a recipe that seems absent, and
do not bother overriding one at a path nothing reads.

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

**Deleting a pool entry silently buffs everything left.** Loot weights are
relative, so removing entries shrinks the denominator and every survivor gets
more common. To take something out *without* changing anyone else's odds, add
back the removed weight as an empty entry:

```json
{ "type": "minecraft:empty", "weight": 38 }
```

`minecraft:empty` is a real 1.21.1 entry type — vanilla uses it in 19 tables,
e.g. `chests/ancient_city` at weight 75. KC's `village_chest` went from 104 total
weight to 74 after four removals; a weight-38 empty restored all six survivors to
their exact original per-roll chance. Entries with no `weight` key default to 1,
so a uniform pool needs an empty of weight 1 per entry removed.

**One chest rolls exactly one loot table.** The chest's block entity carries a
single `LootTable` string baked in by the structure piece that placed it — there
is no "merge every mod's table" step. The only way several mods land in one chest
is NeoForge global loot modifiers, which run *after* the base table and can
attach to any table id.

So a mod's own chest table gets contributions from nobody unless a GLM names it.
KC's `village_chest` is reached only through its five village kitchen houses
(`data/kaleidoscope_cookery/structure/village/houses/*_kitchen.nbt`, injected
into vanilla jigsaw pools); of the 125 loot modifiers across this pack's mods,
every chest-targeting one points at `minecraft:chests/...`, so nothing adds to
KC's table. Editing it does not touch ordinary village loot, and vice versa.

Structure `.nbt` files are gzipped — searching the raw bytes for a loot table id
finds nothing. Decompress first (`gzip.decompress`), then look for `LootTable`.

**`neoforge:can_tool_perform_action` is dead in NeoForge 1.21.** The ToolAction
→ ItemAbility rename made it `neoforge:can_item_perform_ability`, and the field
`action` became `ability`. Both changed:

```json
{ "condition": "neoforge:can_item_perform_ability", "ability": "pickaxe_dig" }
```

One bad condition kills the **whole** modifier — NeoForge logs
`Could not decode GlobalLootModifier with json id ...` once and the drop simply
never happens. Miner's Delight's `breaking_infested_blocks` shipped this way, so
infested blocks never gave silverfish eggs. Only the 23 valid ItemAbilities are
accepted; confirm against `ItemAbilities` in the NeoForge sources jar.

**GLM files honour `neoforge:conditions`.** `LootModifierManager` parses through
`IGlobalLootModifier.CONDITIONAL_CODEC`, so the usual `neoforge:false` stanza
disables one cleanly and logs nothing — same pattern as recipes.

**Mods overwrite vanilla entity loot outright.** Cultural Delights ships its own
`data/minecraft/loot_table/entities/squid.json` and `glow_squid.json`, replacing
the drop entirely — squid gave `culturaldelights:squid` *instead of* an ink sac,
not alongside it. To undo that, copy the table back out of the 1.21.1 client jar
rather than hand-writing it; diff the result against vanilla to prove it matches.
Global loot modifiers layered on the same entity (Miner's Delight's knife
scavenging) are unaffected and keep working.

**A GLM may be invisible in EMI even when it works.** AdvancedLootInfo attributes
a modifier to a block by looking for a loot-table-id condition it recognises. If
the modifier gates on a mod's own condition — Miner's Delight uses
`minersdelight:block_tag` — ALI cannot tell which blocks it applies to and logs
`Unable to locate destination for GLM farmersdelight:add_item`. The drop happens;
nothing advertises it. To make it discoverable, move the drop into the block loot
tables themselves (it then shows under `ali:block_loot`) and disable the mod's
GLM with `neoforge:false` so drops do not double. Resolve the modifier's block
tag first — `minersdelight:infested_blocks` needed seven tables, including
`minecraft:infested_cobblestone` via `#c:cobblestones/infested`.

---

## Data maps

NeoForge data maps (`data/<ns>/data_maps/<registry>/<name>.json`) drive
behaviour that looks code-only. Miner's Delight's copper pot fills and pours cups
purely through `minersdelight:cup_variant`, which maps each soup item to its cup
form. Emptying that map kills the whole mechanic at the source, which is far
cleaner than disabling recipes and hoping the block stays unobtainable:

```json
{ "replace": true, "values": {} }
```

`DataMapFile` takes `replace` (bool, default false), `values` and `remove`.
**Data maps merge across packs like tags**, and CBTweaks loads after mod data, so
`replace: true` discards every earlier contribution — which matters because two
different mods were both writing to that one file. That also makes the override
source-agnostic: a future mod adding entries to the same map is cancelled too,
with no list to maintain.

**Mods register items into other mods' namespaces.** MyNethersDelight's compat
cups are `minersdelight:rock_soup_cup`, `minersdelight:egg_soup_cup` and three
more — Miner's Delight ids, shipped inside the MyNethersDelight jar, models under
`assets/minersdelight/`. Enumerating one mod's jar therefore *misses* items that
carry its namespace. When building a list of "every item mod X adds", scan
`assets/<namespace>/models/item/` across **all** jars, not just that mod's:

```bash
python - <<'PY'
import zipfile, glob, re
for j in glob.glob("mods/*.jar"):
    for n in zipfile.ZipFile(j).namelist():
        m = re.match(r'assets/minersdelight/models/item/(.+)\.json$', n)
        if m: print(j, m.group(1))
PY
```

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
not `setFood`, to keep the existing nutrition.

**`modifyFood` silently inflates saturation.** KubeJS's `FoodBuilder`
constructor reads `FoodProperties.saturation()` — the *absolute* value — into
its `saturation` field, but `build()` passes that same field to
`FoodConstants.saturationByModifier(nutrition, value)`, which is
`nutrition * value * 2`. Read as absolute, written as a modifier. So **any**
`modifyFood` round-trip re-multiplies saturation, even one that only adds an
effect. `candelight_food_effects.js` did exactly that on four dishes for months.

Always set the saturation explicitly in the same call, and remember the value is
a **modifier**, not the saturation:

```js
event.modify('candlelight:lasagne', item => {
  item.modifyFood(food => {
    food.saturation(0.7)   //Candlelight's own modifier -> 10 * 0.7 * 2 = 14.0
    food.effect('farmersdelight:comfort', 4800, 0, 1.0)
  })
})
```

`modifier = targetSaturation / (nutrition * 2)`. Nutrition needs no
compensation — it round-trips as an int. Do **one** `modifyFood` per item; a
second pass re-triggers the same inflation, so fold effects and values together.

**Effect tooltips come from the item class, not the food component.** Farm &
Charm's `ConsumableItem` and `EffectFoodItem` override `appendHoverText` to list
a food's effects; a plain `net.minecraft.world.item.Item` renders nothing, so
effects added via `modifyFood` work when eaten but are invisible in EMI. Mods
mix both — Miner's Delight registers `seasoned_arthropods` and `weird_caviar` as
FD `ConsumableItem` (tooltips appear) but `insect_wrap` and `insect_sandwich` as
plain `Item` (nothing). Item class is fixed at registration and cannot be
changed from a datapack or KubeJS. Draw the lines yourself in a *client* script,
matching FD's placement — line 1, under the name and above the id — and its
zero-padded `MM:SS`:

```js
ItemEvents.modifyTooltips(event => {
  event.modify('minersdelight:insect_wrap', tooltip => {
    tooltip.insert(1, [
      Text.blue(Text.translate('effect.minecraft.haste').append(' (01:00)'))
    ])
  })
})
```

`event.add()` appends *below* the id and the EMI hint lines, which looks nothing
like the native rendering — use `modify` + `insert`. FD's own tooltips are gated
on its `ENABLE_FOOD_EFFECT_TOOLTIP` config; hand-drawn ones are not.

**Reading a mod's food values** means decompiling, since 1.21 food lives in
code. Most delight-likes keep a `FoodValues`-style class (`MDFoodValues`,
`CandlelightFoods`, `MNDFoodValues`, FD's `FoodValues`); parse `nutrition:(I)`
and `saturationModifier:(F)` pairs out of its `<clinit>`. Watch for items that
skip the class entirely — Candlelight's `chicken_with_vegetables` reuses vanilla
`Foods.GOLDEN_CARROT`, so it appears in no food-values table at all.

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

---

## EMI biome thumbnails

`emi_ores` puts **every registered biome** into the EMI index
(`add_biomes_to_index: true`) and looks up a 16×16 sprite at
`assets/<biome_namespace>/textures/biome/<path>.png`. With none present it draws
`emi_ores:biome/missing`, a checkerboard. emi_ores registers those into the
blocks atlas via its own `assets/minecraft/atlases/blocks.json` directory
source, which scans **all** namespaces — so a sprite added under CBResources is
picked up with no atlas file of our own.

It enumerates `registryOrThrow(Registries.BIOME).stream()`, with no filter for
whether worldgen actually places the biome. **A biome disabled in config is
still listed and still needs a sprite.** BWG's
`config/biomeswevegone/world_generation.json` switches four off
(`allium_shrubland`, `eroded_borealis`, `pumpkin_valley`, `shattered_glacier`) —
they can never be visited or screenshotted, but they still show in EMI. That
config file is gitignored, so those toggles don't reach a clone.

Worklist and tooling live in `chunkbound_info/`; see
[tools/README.md](chunkbound_info/tools/README.md).
[BIOME_SPRITES.md](chunkbound_info/BIOME_SPRITES.md) tables every modded biome,
its current sprite and its reference screenshot. Both scripts are stdlib-only
and derive their paths from their own location:

```bash
python chunkbound_info/tools/downsize_screenshots.py   # after adding a screenshot
python chunkbound_info/tools/build_biome_doc.py        # after adding a sprite
```

Screenshots are filed per mod as `screenshots/<mod>/<biome>.png`, and the
filename **is** the biome id — a mismatch silently drops the row, so the
generator warns about names matching no registered biome. Full-res originals
(~8 MB each) stay in `screenshots/` and are gitignored; the 240px copies in
`shots/` are what the doc embeds and what gets committed.

**Three things that silently produce wrong art**, all found the hard way:

- **Vanilla textures are 4-bit indexed PNGs.** An 8-bit-only reader fails on
  every one of them, so vanilla blocks sample as "missing" with no error.
- **Most modded leaf textures are greyscale**, tinted at runtime by the biome's
  foliage colour. Sampling them directly gives grey trees. Treat a texture with
  saturation below ~0.12 as a tint target.
- **BoP gives a placed feature and its configured feature the same id.**
  Resolving a feature reference as "placed, else configured" therefore loops
  forever and finds no trees. Resolve the two namespaces separately.

Biome JSONs carry `effects.grass_color` / `foliage_color` / `sky_color` /
`water_color`, and the mods ship full biome tag sets (`c:is_cave`, `c:is_sandy`,
`is_nether`, even RU's `surface/sand`, `surface/peat`, `surface/silt`) — enough
to classify a biome from data instead of guessing from its name.

---

## EMI tab order

Category order is data-driven. EMI's `emi:category_properties` reload listener
reads `category/properties` and takes an `order` int per category; lower sorts
earlier, and `getOrder` returns **0** for any category with no entry.

Ours lives at
`CBResources/assets/emi/category/properties/chunkbound.json`:

```json
{ "farmersdelight:cutting": { "order": -910 },
  "ali:block_loot":         { "order": 700 } }
```

**The namespace must be `emi`, not ours.** The loader does
`if (!id.getNamespace().equals("emi")) continue;` — a file under
`assets/chunkbound/emi/...` is skipped with no error. The *filename* is free
(EMI ships `emi.json`, emi_ores ships `emi_ores.json`); every file merges, so
only declare the categories you care about and avoid redeclaring another pack's
keys, which makes the winner depend on resource order.

EMI's own baseline runs `minecraft:crafting` -1000 through `emi:tag` 1000, with
`stonecutting` -800, `smithing` -750, `brewing` -650, `world_interaction` -600,
`fuel` 900, `composting` 910, `info` 950. emi_ores sets its two at 400.
Everything else in this pack — ~41 modded cooking categories and all 15 `ali:*`
loot categories — shipped with no order at all, so they tied at 0 and fell back
to registration order, which is why tabs moved around between launches.

Current bands: cooking -910..-826 (kept ahead of stonecutting so the block stays
contiguous), block drops 700, loot tables 720+, effects 800. Steps of 2 leave
room to insert.

Category ids are easiest to enumerate from lang keys — `emi.category.<ns>.<path>`
across every mod jar. Note the loot tabs come from **AdvancedLootInfo** (`ali:`),
not EMI Loot; `config/emi_loot_config.toml` is a leftover from a mod that is no
longer installed.

This is a *resource* pack, so it needs a client restart or F3+T.

---

## EMI index editing

`assets/emi/index/stacks/<name>.json` edits the item index — `removed` (drop
stacks), `added` (`{"added": …, "after": …}`), `filters` (id strings, or a
`/regex/`), `disable`. Same namespace rule as category properties: the loader
does `getNamespace().equals("emi")`, so the file must sit under `assets/emi/`
whatever we call it. Every file in the folder merges.

**An ingredient string needs three parts.** `EmiStackSerializer`'s bare-string
form is matched against

```
^([\w_\-./]+):([\w_\-.]+):([\w_\-./]+)(\{.*\})?$
```

— that is `type:namespace:path`, e.g. `item:artifacts:cowboy_hat`. A natural
looking `"artifacts:cowboy_hat"` has only two parts, matches neither the regex
nor the `isJsonObject` branch, and is **discarded with no log line** — the whole
entry silently does nothing. Prefer the explicit object form, as
`cbtweaks.json` already does for effects:

```json
{ "removed": [ { "type": "item", "id": "artifacts:cowboy_hat" } ] }
```

**EMI dedupes the index on item + `DataComponentPatch`**
(`EmiStackList$StrictHashStrategy`), not on item alone. So one item occupies two
index slots whenever two sources contribute stacks whose components differ, even
though both render identically.

**A duplicate whose stacks differ only by *random* NBT cannot be de-duplicated
from a pack.** Relics and Reliquified Artifacts (both since removed) hit this:
every Artifacts item registered into two creative tabs, and Relics rolled a
**fresh random `relics:data` component per entry**, so the two stacks differed
in NBT and the dedupe legitimately kept both. Each available lever failed for
its own reason, so don't re-attempt this shape of fix:

- `removed` compares **strictly, including NBT**, and rolled values change on
  every index rebuild, so no fixed stack ever matches. In-game Ctrl+Click hides
  (`edit-mode`) go stale for the same reason.
- `filters` matches `EmiStack.getId().toString()` and does catch every copy, but
  `EmiHidden.isDisabled()` re-applies filters at *render* time, which suppresses
  an `added` replacement too — the items vanish entirely. Tested.
- `c:hidden_from_recipe_viewers` is all-or-nothing, same result.

EMI's data format cannot express "keep exactly one of two randomly-rolled
stacks"; such a fix belongs upstream in the offending mod.

---

## Retiring a duplicate item

The pack folds duplicates into one surviving item — usually KC's into Farmer's
Delight, but not always. The full sequence, in order, is:

1. Point every recipe that consumed it at the surviving tag or item.
2. Disable every recipe that *produced* it (`neoforge:false`).
3. Retarget or strip every loot table that dropped it.
4. Strip it from every tag — resolve merged tags, do not trust file presence.
5. Add it to `c:hidden_from_recipe_viewers` so EMI stops listing it.

Retired so far: KC's `flour`, `raw_dough`, `lettuce`, `lettuce_seed`, `tomato`,
`tomato_seed`, `rice`, `rice_panicle`, `wild_rice`, `cooked_rice`, and the eight
meat items (`raw`/`cooked` × `lamb_chops`, `cow_offal`, `pork_belly`,
`cut_small_meats`). Each should end up in exactly one tag — the hidden one.
Verify with a sweep that re-resolves recipes, loot and tags with overrides
applied, rather than trusting that each individual edit landed.

**The survivor is not always the FD item.** `farmersdelight:dog_food` was
retired in favour of `farm_and_charm:dog_food` — same display name, and the pack
had already retargeted F&C's `crafting_bowl/dog_food` recipe onto `c:` tags.
Check which version the pack already invested in before assuming the direction.

Cooked rice is deliberately **stockpot-only**: KC's nine `stockpot/rice_N`
recipes were retargeted to output `farmersdelight:cooked_rice` and FD's own
`cooking/cooked_rice` is disabled. That is a gameplay choice, not an oversight —
do not "fix" it by re-enabling the FD recipe. KC's `pot/egg_fried_rice` and
`flex_pot/egg_fried_rice` already asked for `#c:foods/cooked_rice`, so stripping
the KC item from that tag fixed them for free; the nine
`cooked_rice_to_sticky_rice_cake_N` recipes needed the swap by hand.

Three traps this sequence hits repeatedly:

- **A tag can't be a recipe result.** Ingredients can move to `#c:foods/tomato`,
  but a result needs a concrete item, so producing recipes either get retargeted
  to the FD item or disabled.
- **Stripping a leaf tag can empty it.** `c:crops/lettuce`, `c:grain/rice` and
  `c:seeds/rice` had only the KC item, so they are now empty; any recipe still
  pointing at them would become uncraftable. Check who references a tag before
  emptying it. Where the leaf keeps other members (`c:crops/tomato` → FD tomato)
  the strip alone is enough and recipes need no edit.
- **Recipes and loot are not the only sources.** Bountiful hands items out as
  villager bounty rewards from
  `data/bountiful/bounty_pools/<namespace>/<profession>_rews.json` — how
  `farmersdelight:dog_food` stayed obtainable long after its recipe was
  disabled. It reads them with `ResourceManager.listResources`, so only the
  highest-priority file per path is seen and a CBTweaks copy overrides the mod's
  outright. Retarget the entry's `content` to the surviving item instead of
  deleting the entry: a pool has no `minecraft:empty` equivalent, so removing
  one raises every other reward's chance. (`config/bountiful/bounty_pools/` is a
  separate user-config folder, empty in this pack.)

Retiring an item can orphan neighbours — check for recipes that consumed it and
now have no input, and for crops whose seed is gone. Planting is code-driven
(`BlockItem`), so a seedless crop block stays placeable by command but cannot be
obtained.

---

## Effects

**Read the category from bytecode, never the name.** Each effect class's
constructor passes a `MobEffectCategory`. Several mods mix all three in one
registry, and Kaleidoscope Cookery registers *everything* as BENEFICIAL because
its `BaseEffect(int)` constructor hardcodes it — including Hinder and Flatulence.

**Effect ids come from the ProbeJS dump**, which is the only complete list:
`.probe/@special/types/index.d.ts`, the `type MobEffect = ...` union. 152 here.

Compiled results:
[BENEFICIAL_EFFECTS.md](chunkbound_info/BENEFICIAL_EFFECTS.md)
(also published to the repo wiki).

---

## Git & repo conventions

- `main` is the working branch. Commit and push only when asked.
- `emi.json`, `minecraftinstance.json` and `options.txt` are tracked but
  rewritten every launch — leave them dirty, never commit them.
- Per-mod runtime config that's pure per-machine/user noise (`config/attributefix/`,
  `xaero`, `sodium-options.json`, …) is gitignored and untracked on purpose.
  Config holding actual gameplay/balance data we edit (`config/bountiful/`,
  `config/biomeswevegone/`, `config/cobblemon/`, `config/artifacts/`,
  `config/regions_unexplored/`) is tracked — don't add it back to `.gitignore`.
- **Any config file an edit needs to touch gets un-gitignored, every time.**
  If a task requires changing a value inside a currently-ignored `config/...`
  path, remove that path from `.gitignore` as part of the same change — don't
  make a gameplay-relevant edit to a file git can't see.
- **`.gitignore` is whitelist-style**: everything under `/` is ignored unless
  explicitly `!`-listed. New root files need an entry or they silently never
  reach a clone.

**Non-JSON files in a datapack are harmless.** Verified two ways: the shipped
`MSD item pack` zip contains `readme.txt` and `chud.jpeg` at its root and loads
fine, and this pack launched cleanly with markdown files in the CBTweaks root.
Minecraft only reads `pack.mcmeta`, `pack.png` and `data/`; loaders filter to
`.json` anyway — mods even ship `.js` and `.zs` files inside `data/`.

**Never keep two copies of the same datapack file.** `kubejs/data/` and
CBTweaks both had `kaleidoscope_cookery/loot_table/chest/village_chest.json`;
whichever loaded last silently won, and they had drifted apart. All datapack
content now lives in CBTweaks.

**Removing a mod strands its CBTweaks overrides.** Dungeons Delight was pulled
but 13 files stayed under `data/dungeonsdelight/`, and its five
`recipe/monster_cooking/*.json` then errored on every reload with
`Unknown registry key ... recipe_serializer: dungeonsdelight:monster_cooking` —
the serializer left with the jar. Sweep `data/<modid>/` and any
`chunkbound/recipe/compat/**/<modid>/` when a mod goes.

**Diff error counts against an older log before blaming an update.** Several
errors that looked like fresh regressions after a mod bump were present at the
same per-reload count weeks earlier. Normalise for reload count — one launch can
reload resources three or four times, multiplying every message:

```bash
zcat logs/2026-08-10-6.log.gz | grep -c "same id:"   # baseline
grep -c "same id:" logs/latest.log                    # now
```

---

## Useful investigation commands

```bash
# what actually defines / contributes to a tag (include NeoForge!)
for j in mods/*.jar; do unzip -p "$j" "data/c/tags/item/foods/onion.json" 2>/dev/null \
  && echo "  ^ $j"; done
unzip -p .probe/source_jars/neoforge-*-sources.jar "data/c/tags/item/foods/onion.json"

# an effect / recipe / food class's real behaviour.
# javap is NOT on PATH in the bash tool - use the JDK's copy:
JAVAP="/c/Program Files/Java/jdk-21/bin/javap.exe"
"$JAVAP" -p -c -constants -cp mods/<mod>.jar <fully.qualified.Class>

# static field values (food tables, effect categories) live in <clinit>
"$JAVAP" -p -c -constants -cp mods/<mod>.jar <Class> | sed -n '/static {}/,$p'

# which lambda backs an inline registration: read BootstrapMethods
"$JAVAP" -v -p -cp mods/<mod>.jar <Class>   # then match InvokeDynamic #N

# mod jars are readable by name; the vanilla client jar is obfuscated,
# so javap on net.minecraft.* fails - use known values or the sources jar

# vanilla reference data (loot tables, tags) - authoritative for 1.21.1
unzip -p "$MC_INSTALL/versions/1.21.1/1.21.1.jar" data/minecraft/loot_table/entities/drowned.json

# group launch errors by cause instead of reading 600 lines
grep "Parsing error loading recipe" logs/latest.log \
  | sed -E 's/.*JsonParseException: //' | sort | uniq -c | sort -rn
```
