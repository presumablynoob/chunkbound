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
| `config/reliable_recipes/`, `reliable_remover/`, `reliable_replacer/` | Rule files, one per mod per folder. **First choice for any change.** |
| `config/paxi/datapacks/CBTweaks/` | The pack's datapack. Recipe/tag/loot overrides that no rule or script can express. |
| `config/paxi/resourcepacks/CBResources/` | The pack's resourcepack. Textures, lang, ponder structures. |
| `kubejs/startup_scripts/` | Item component edits (food effects, stack sizes) — not datapack-able. |
| `kubejs/client_scripts/` | Lang renames and Ponder scenes. |
| `kubejs/server_scripts/` | Runtime tag/recipe edits, and the only way to *add* a recipe. Second choice after a `reliable_*` rule, ahead of a datapack. |
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

**Knife tags are unified - all three resolve to the same 12 items.** Farmer's
Delight loot gates on `farmersdelight:tools/knives`, Kaleidoscope loot gates on
`kaleidoscope_cookery:kitchen_knife`, and **102 recipe files** across FD, MND,
Cultural Delights, Miner's Delight, Brewin' & Chewin', Starcatcher and Ender's
Delight gate on `c:tools/knife`. As shipped these disagreed: KC already pulled
`#farmersdelight:tools/knives` transitively, but `c:tools/knife` held only FD's
own five knives, so no Kaleidoscope kitchen knife worked in any FD recipe. Two
additive CBTweaks files fix it - `data/farmersdelight/tags/item/tools/knives.json`
adds the two new knives, and `data/c/tags/item/tools/knife.json` adds
`#farmersdelight:tools/knives` transitively so the sets stay equal as mods come
and go. Side effect worth knowing: `bakery:bread_knife` now works for FD recipes.

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

**An item with no recipe may just be compat-gated.** Kaleidoscope Nether ships
the only recipes for `mapo_tofu` and `mapo_tofu_rice` under
`data/youkaishomecoming/recipe/pot/` behind `neoforge:mod_loaded:
youkaishomecoming`, which is not installed. The items still register and still
appear in EMI; only the recipes are conditional, so they read as "unviewable".
Seven KN items are in this state across `youkaishomecoming`, `betternether` and
`cataclysm`. Before calling an unobtainable item a bug, check every producing
recipe for a `mod_loaded` condition. The full Kaleidoscope Nether / End audit -
duplicate ingredients, empty tags, overlapping mob drops and 11 failing loot
modifiers - is tracked in
[issue #15](https://github.com/presumablynoob/chunkbound/issues/15).

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

Installed: **KubeJS 2101.7.2**, Rhino 2101.2.7, plus **kubejs-create 2101.3.1**.
Docs at <https://kubejs.com/wiki> — but it spans every MC version, so confirm
anything version-sensitive against the jar before relying on it.

### What is available here

Event namespaces: `StartupEvents` (`init`, `postInit`, `registry`,
`modifyCreativeTab`), `ServerEvents` (`recipes`, `afterRecipes`, `tags`,
`compostableRecipes`, `recipeTypeRegistry`, `specialRecipeSerializers`,
`command`, `commandRegistry`, `generateData`, `loaded`, `tick`), `ItemEvents`
(`modification`, `modifyTooltips`, `dynamicTooltips`, `foodEaten`, `crafted`,
`smelted`, `pickedUp`, `rightClicked`, `toolTierRegistry`, `armorTierRegistry`),
`BlockEvents`, `PlayerEvents`, `EntityEvents` (`spawned`, `checkSpawn`, `death`,
`hurt`), `LevelEvents`, `NetworkEvents`, `ClientEvents` (`lang`, `tick`,
`paintScreen`, debug info), `RecipeViewerEvents` (`removeEntries`,
`removeRecipes`, `addEntries`, `groupEntries`, …).

**Worldgen is still not usable on 1.21.1.** The wiki's worldgen support stops at
1.20.1 and says outright it does not work there. Biome spawn lists, features and
the `neoforge:none` cancellations stay datapack files — see the phantom section
below.

### Recipes

**Vanilla types have builders — do not reach for `event.custom` first.**
`event.shaped`, `event.shapeless`, `event.smelting`, `event.blasting`,
`event.smoking`, `event.campfireCooking`, `event.stonecutting`,
`event.smithing`, each chainable with `.xp()`, `.id()` and friends.

**Builders come from data-driven recipe schemas**, shipped at
`data/<namespace>/kubejs/recipe_schema/<type>.json` — a `keys` list of
name/role/type entries, with `parent` for inheritance and `functions` for extra
builder methods. So `event.recipes.<namespace>.<type>(…)` exists only where some
jar ships a schema. Checked here: KubeJS itself ships 36 (vanilla), kubejs-create
ships ~20 for Create, and **Farm & Charm, Farmer's Delight and Kaleidoscope
Cookery ship none.**

**For a modded type with no schema, `event.custom({…})` takes the raw recipe
JSON** — the same object the datapack file holds. That is the route for
`farm_and_charm:pot_cooking`, `farmersdelight:cooking`,
`kaleidoscope_cookery:millstone` and the rest. Authoring a schema is possible but
rarely worth it for a handful of recipes.

Removal and retargeting take a **filter** object — `{output, input, mod, type,
id}`, combinable, with `not:` for negation and an array for OR:

```js
event.remove({ type: 'minecraft:campfire_cooking', output: 'minecraft:cooked_chicken' })
event.replaceInput({ id: 'examplemod:x' }, 'minecraft:stick', '#minecraft:saplings')
```

Because `replaceInput` is filter-scoped, KubeJS *can* express the one case
Reliable Recipes cannot — the same source going to two different targets in
different recipes. Rules still come first; this is the fallback for that shape.

### Zero-arg Java methods are properties in Rhino

`SceneBuildingUtil.select()`
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
config file is **tracked** - it carries those four toggles and the three region
weights, so it has to reach a clone. BWG rewrites it with a different key order
whenever the mod list changes, which surfaces as a diff with no value changes;
commit the reorder rather than reaching for `.gitignore`.

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

**Removal now goes through Reliable Remover, not the datapack sequence below.**
`reliable_remover` reads JSON rule files from `config/reliable_remover/` (not
gitignored, so they reach a clone) and its `remove` action covers creative tabs,
EMI/JEI/REI, loot tables, player inventories, storage, world drops and villager
trades in one declaration:

```json
[ { "action": "remove", "items": [ "namespace:item_id" ] } ]
```

Beyond `items`, a rule can select with `blocks`, `fluids`, `effects`, `tags`,
`mod` (a whole namespace), `patterns` (regex, `/.*_sword/`), `nbt`, `registry`,
`tag_type`, `dimensions` and `advancements`, and `not` inverts a condition.
Granular actions exist too — `remove_creative`, `remove_loot`,
`remove_chest_loot`, `remove_trade`, `remove_enchantment`, `remove_potion` — 16
in all. Global toggles live in `config/reliable_remover.json`. Docs:
<https://moddedmc.wiki/en/project/reliable-remover/latest/docs/reliable-remover/usage>

**None of Reliable Remover's 17 actions removes a recipe.** Verified against the
jar: `RecipeManagerMixin` only calls `RuleManager.load()`, and the `Action` enum
has no recipe entry. On its own it would leave a producing recipe running, with
the result deleted again by `removeItemsFromInventories` — which reads as a
broken craft. Recipe work belongs to its sibling, **Reliable Recipes** (below).

`RemovalRule` does have a `replace_with` field (JSON is snake_case via
`@SerializedName`; the Java fields are `replaceWith`/`tagType`) which forwards to
`ReliableRecipesAPI.registerItemReplacement`, but that mapping is **global per
item**, so it cannot express two different targets for one source item — and this
pack needs exactly that (`raw_cut_small_meats` → `minecraft:mutton` in
donkey_burger but a tag in stuffed_tiger_skin_pepper). Use Reliable Recipes'
per-recipe `replace_input` for those, not `replace_with`.

What Reliable Remover replaces cleanly: `c:hidden_from_recipe_viewers` entries,
creative tab presence, loot, world drops, storage, trades and mob equipment —
including sources a datapack sweep misses, like Bountiful bounty pools.

### Reliable Replacer

Block-level worldgen swaps, rule files in `config/reliable_replacer/` (a JSON
array). `inputs` → `output`, filtered by `biomes`, `dimensions`, `structures`,
`features`, coordinate bounds, `neighbors`, `probability` and `not`; `retrogen`
applies the swap to **already-generated chunks**, and `player_blocks: false`
spares anything a player placed. JSON keys are snake_case (`keep_states`,
`output_state_properties`) via `@SerializedName`, as with the other two mods.
There is also a `remove` boolean for deleting a block outright.

Use it to stop a retired mod's blocks reaching the world at all, rather than
patching their drops afterwards. `config/reliable_replacer/kaleidoscope_cookery.json` does
this for KC's tomato crop.

**KC's crops only enter the world through village kitchen houses.** KC ships no
wild-crop feature and no biome modifier; `kaleidoscope_cookery:tomato_crop` is
baked into three of its five structure NBTs (`plains`, `savanna`, `taiga`
`_kitchen.nbt`), each at `age=7`. `lettuce_crop` and `rice_crop` appear in no
structure, so they never generate. KC's `worldgen/processor_list/crop_replace`
(which would diversify tomato into chili/lettuce) is referenced by nothing in any
jar and appears vestigial. Structure NBTs are gzipped **and** a regex over the
decompressed bytes bleeds between palette entries — parse the NBT properly before
trusting a block state read out of one.

Crop age ranges differ between mods: KC's is `age=0..7`, Farmer's Delight's is
`age=0..3` plus `ropelogged`. So `keep_states` must be **false** on a cross-mod
crop swap — copying `age=7` onto the FD block is an invalid state. Pin the age
with `output_state_properties` instead.

### Reliable Recipes

Rule files live in `config/reliable_recipes/`, as a **flat top-level JSON array**
of rules, each with an `action`. Read at server start and on data reload.

Recipe actions (`RecipeRule$Action`): `remove`, `replace_input`,
`replace_output`, `prevent_repair`, `set_repair_material` — the JSON action names
are `remove_recipe`, `replace_input`, `replace_output`, `prevent_repair`,
`set_repair_material`. Tag actions (`TagRule$Action`): `remove_from_tag`,
`clear_tag`, `remove_all_tags`.

```json
[
  { "action": "remove_recipe", "id": ["minecraft:wooden_pickaxe"] },
  { "action": "replace_input", "target": "minecraft:stick",
    "replacement": ["minecraft:bamboo"], "id": "examplemod:reinforced_sword" },
  { "action": "remove_from_tag", "tag": "c:foods", "id": ["examplemod:x"] }
]
```

Recipes are selected by `output`, `id`, `mod`, `type` or `input`; a `/…/` string
is a regex, `+#` (or `{"expand": true}`) expands a tag to its members, and `not`
/ `or` / `and` combine conditions. `remove_recipe` is what replaces a
`neoforge:false` stanza, and `replace_input` replaces a hand-written retarget.

**The two mods are wired together.** `reliable_remover`'s `CommonClass` calls
`ReliableRecipesAPI.registerContextualItemHider(...)` at init, and Reliable
Recipes' `TagModifier.applyHiddenItemRules()` then walks every registered item,
asks `isItemHidden(stack, "tag:item")`, and strips every hidden item out of
**every** item tag (and block tags via `"tag:block"`). It logs
`Hidden items integration removed {} item-tag associations.`

So with both installed, an item removed by Reliable Remover **is already gone
from every tag** — the datapack's per-tag `remove` files for a retired item are
redundant. Check that log line before deleting them, since this only holds while
both mods are present.

**That log line cannot confirm a tag file *before* you delete it.** It counts
memberships that survive datapack processing, so while a CBTweaks `remove` file
is in place its item contributes 0 either way. The check only runs in one
direction: delete the tag file first, relaunch, and confirm the number goes
**up**. It resolves nested tags, so one item can move it by several — dropping
`c:crops/corn.json` moved it 156 -> 162, `corn_cob` being reachable through
`cornexpansion:corn`, `c:crops`, `farm_and_charm:corn`, `farm_and_charm:crops`
and `tide:bait_plants`. Take "it went up" as the pass condition rather than
predicting an exact delta.

### An item id and a tag id can be the same string

**Removing an item kills any item tag that shares its id, and every recipe using
that tag is silently dropped from the recipe manager.** Farm & Charm registers
both an item `farm_and_charm:tomato` and an item *tag* `farm_and_charm:tomato`
(likewise `onion`). Putting the item in a Reliable Remover `remove` rule took the
tag with it, and the 11 live recipes that asked for `#farm_and_charm:tomato` —
Candlelight's `fresh_garden_salad`, `harvest_plate`, `salad`,
`tomato_mozzarella_salad` and `tomato_soup`, `bakery:vegetable_sandwich`, both
Create mixing variants — vanished. `Loaded NNNNN recipes` fell by exactly that
count, and nothing was logged.

The tag's *contents* are a red herring: `farm_and_charm:tomato` forwards to
`#c:crops/tomato`, which still held `farmersdelight:tomato`. Restoring the
datapack's tag `remove` files changed nothing, which is what ruled the tag
contents out.

**Check for the collision before removing anything** — look for the item's own
id as a tag path, across every jar:

```bash
for j in mods/*.jar; do
  unzip -Z1 "$j" "data/<ns>/tags/item*/<item_path>.json" 2>/dev/null \
    && echo "  ^ collides, shipped by $j"
done
```

The fix stays in the rule files. Point the recipes at the surviving tag with
`replace_input`, and keep the item in the remover:

```json
{ "action": "replace_input", "target": "#farm_and_charm:tomato",
  "replacement": [ "#c:crops/tomato" ] }
```

`RecipeRule` parses a `#`-prefixed string into `TagKey.create(Registries.ITEM,
…)` for both `target` and `replacement`, so tag → tag is a supported shape, and
with no selector it rewrites every recipe that names the tag — including jar
recipes CBTweaks does not shadow. Verified: recipes returned to 13224, the count
predicted for the batch.

### Where a change belongs — reliable_*, then KubeJS, then the datapack

This pack is being tuned for performance, and the three mechanisms do not cost
the same. **Use the highest one on this list that can express the change:**

1. **A `reliable_*` rule file.** `remove_recipe` for a `neoforge:false` stanza,
   `replace_input` for a hand-written ingredient retarget, `replace_output` for
   a result swap, `remove` for an item retirement, `remove_from_tag` for a tag
   `remove` list, Reliable Replacer for a worldgen block override.
2. **A KubeJS script.** Chiefly *adding* a recipe, which no reliable_* action
   can do — `RecipeRule$Action` is only `remove`, `replace_input`,
   `replace_output`, `prevent_repair`, `set_repair_material`. `event.custom({…})`
   in `ServerEvents.recipes` takes arbitrary JSON, so modded recipe types work,
   and `Platform.isLoaded('modid')` stands in for a `neoforge:mod_loaded`
   condition. Also the only home for item-component edits (food, stack size) and
   client-side lang/tooltip work.
3. **A CBTweaks datapack file.** Last resort, for what neither of the above can
   express: the data map, the vanilla loot restorations, the `minecraft:empty`
   weight rebalance, the `neoforge:none` biome modifiers, and the bakery
   `give_item` retargets.

**Two things not to forget when moving work up to KubeJS.** `ServerEvents.tags`
runs *after* datapacks, so a script `add()` silently overwrites a datapack
`remove` — the failure documented at the top of this file. And a script that
loads cleanly has not necessarily run; `3/3 scripts loaded, 0 errors` says
nothing about whether a recipe callback threw. Verify with `Loaded NNNNN
recipes`, not with the script log.

Items already retired the old way are being migrated to the reliable_* suite
gradually, a few at a time, not in one sweep.

### Rule file naming — one file per mod, per folder

**A rule file is named after the mod its contents come from, and there is at most
one per mod in each of the three folders.** `config/reliable_recipes/farm_and_charm.json`,
`config/reliable_remover/culturaldelights.json`, and so on. Never name a file
after the batch, the item, or the mechanic — `kc_meats.json`, `mincer.json` and
`dried_corn.json` were all renamed away from that.

Use the **mod id**, not the display name: `cornexpansion.json`, not
`corn_expansion.json`.

Two consequences worth knowing:

- **"The mod it's from" means the jar that ships the content, not the namespace
  of the id.** `minecraft:flour_from_{1..8}_wheat` are shipped by the KC jar, so
  they live in `reliable_recipes/kaleidoscope_cookery.json`. The 17
  `culturalrecipes:` ids are shipped by Cultural Delights, so they live in
  `reliable_recipes/culturaldelights.json`. Mods register into other mods'
  namespaces constantly here — file by jar.
- **Different `action`s or keyings coexist in one file.** A rule file is a flat
  top-level array, so a file can hold several rules.
  `reliable_recipes/kaleidoscope_cookery.json` carries one `remove_recipe` keyed
  on `output` (the eight meats) and a second keyed on `id` (the other 17). Do not
  split a mod into two files to separate them.

This keeps the mod-removal sweep trivial: when a mod goes, delete its file from
each of the three folders alongside its `data/<modid>/` overrides.

The mods' own shipped example files are kept but renamed to `.json.disabled`, the
extension the loaders skip — `swapper.json` was live and logged two
`examplemod:input_block` warnings every launch until it was disabled.

**Done: all of Kaleidoscope Cookery** — the eight meats and the ten
flour/dough/lettuce/tomato/rice items, plus its crop worldgen swap:

| File | What |
|---|---|
| `reliable_remover/kaleidoscope_cookery.json` | `remove`, 18 items |
| `reliable_recipes/kaleidoscope_cookery.json` | `remove_recipe` × 2 — 8 by `output`, 17 by `id` |
| `reliable_replacer/kaleidoscope_cookery.json` | `tomato_crop` → FD tomatoes, retrogen |

That retired 93 CBTweaks files. **Key on `output` only when the result is itself
a retired item** — the nine KC recipes needed `id` keying because their results
include `minecraft:bone` and `kaleidoscope_cookery:sashimi`, and output-keying
would have removed every bone recipe in the pack.

What deliberately stays hand-written: the ~57 *retarget* recipes (stockpot rice,
sticky rice cakes, the soups, `straw_block`, `tomato_platter`, and the five meat
consumers). Reliable Recipes' `replace_input` could express simple swaps, but
these are heterogeneous rewrites, and `replace_with` on the remover is global per
item so it cannot handle two targets for one source. The three crop loot tables
stay as `{}` — deleting them would fall back to KC's own table and drop the
retired items again.

Retiring these emptied seven leaf tags (`c:grain/rice`, `c:crops/lettuce`,
`c:seeds/rice`, `c:seeds/lettuce`, `c:seeds/tomato`, `c:vegetables/lettuce`,
`c:foods/lettuce`). Thirty jar recipes still name them, but **all thirty are
shadowed by CBTweaks retargets**, so nothing live is broken. When checking this,
resolve the live recipe — override if present, else jar — because scanning jar
files alone reports thirty false alarms.

Verified three ways, and these are the checks to repeat for the next batch:
`Loaded 12430 recipes` unchanged before and after deleting the 58 (the mixin
filters the JSON map at the head of `RecipeManager.apply`, so removals show up in
that count); `Hidden items integration removed 4 item-tag associations.` after
emptying one tag's `remove` list; and per-reload error count steady at 20.
**EMI's tag view is not a valid check** — `EmiTagsMixin` hides removed items from
tag listings whether or not they are still tag members.

**Known conflict, accepted deliberately.** `stuffed_tiger_skin_pepper` asked for
`c:foods/raw_meats` (plural), which *nothing* defines — NeoForge's real tag is
`c:foods/raw_meat` (singular) and merely references the plural as an optional
sub-tag, so the recipe silently resolved empty and was uncraftable. It now uses
`c:foods/raw_meat`, which collides with same-type KC recipes because
`green_chili` is in `c:crops/chilipepper`:

| Variant | Colliding input | Loses to |
|---|---|---|
| `pot` (4+4) | chicken, `chicken_cuts` | `spicy_chicken` |
| `flex_pot` (1+1) | chicken/beef/pork/rabbit and their cuts | `spicy_chicken`, `braised_beef`, `stir_fried_pork_with_peppers`, `spicy_rabbit_head` |

`kaleidoscope_cookery:pot` is a modded type, so Polymorph does not arbitrate and
one match silently wins. Mutton, `mutton_chops`, `tasty_tail`, shulker filet,
arthropod, spider leg and minced strider are clean in both. This was chosen over
a narrower tag on purpose — do not "fix" it back.

### The legacy datapack sequence

Kept for reading existing overrides, not as the default for new work. The pack
folds duplicates into one surviving item — usually KC's into Farmer's Delight,
but not always. The full sequence, in order, was:

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

## Mob spawning

**Phantoms are moved out of the Overworld.** They never spawn there; instead they
spawn in four soul/undead Nether biomes (`minecraft:soul_sand_valley`,
`incendium:weeping_valley`, `incendium:withered_forest`,
`biomesoplenty:withered_abyss`) and throughout the End. The rule is split because
neither mechanism can do the whole job:

| Half | Where |
|---|---|
| Deny in the Overworld, cap Nether height | `kubejs/server_scripts/phantoms_no_overworld.js` |
| Add to biome spawn lists, limit density | `CBTweaks/data/chunkbound/neoforge/biome_modifier/phantom*.json` |

**Use `EntityEvents.spawned`, never `EntityEvents.checkSpawn`.** KubeJS's own docs
say checkSpawn "only fires for entities from a `BaseSpawner` or world
generation". The vanilla insomnia spawner is neither, so a checkSpawn gate never
sees a phantom - the old `phantoms_end_only.js` was written that way and could
not have worked. `spawned` fires for anything about to be added to a level, so it
catches the insomnia spawner, spawn eggs and `/summon` alike. It also fires for
entities loaded from a save, so cancelling removes existing mobs when their chunk
loads.

**KubeJS 2101 has no worldgen or biome API.** The server-side namespaces are
BlockEvents, EntityEvents, FTB\*, ItemEvents, LevelEvents, LootJS, MoreJS,
NetworkEvents, PlayerEvents, RecipeViewerEvents and ServerEvents - none edits a
biome's spawn list. Biome spawn changes must be datapack `neoforge:add_spawns`
files, and they belong in CBTweaks, not `kubejs/data/`.

**Incendium rewrites the Nether to 192 blocks tall** - `min_y 0, height 192` in
its `data/minecraft/worldgen/noise_settings/nether.json`, moving the bedrock roof
from ~127 to ~191. That is 64 extra blocks of open air and it inflates flying-mob
spawns. `neoforge:add_spawns` has **no height field**, so the cap is enforced in
the KubeJS script instead (`NETHER_PHANTOM_MAX_Y`).

**Weight alone cannot make a mob rare in the End.** The End's monster pool is
enderman and nothing else (weight 10), so any addition takes a large share
whatever its weight. Use `neoforge:add_spawn_costs`, which limits *density*
rather than probability - the spawner sums a charge for nearby mobs of that type
and refuses to spawn once the budget is exceeded. Ours is `charge 1.0` /
`energy_budget 0.06`, far tighter than vanilla's own soul sand valley
(`charge 0.7` / `energy_budget 0.15`).

**Two spawn-control mods were tried and removed. Do not reinstall either.**

- **Mob Control 2.0.0** - a rule with `type="control"` deleted *every* mob in the
  world at spawn time: nothing spawned naturally, spawn eggs did nothing, and
  `/summon` answered "Unable to summon entity". Its `SummonCommandMix` returns
  null when the freshly built entity is not alive, and `MobMix` calls
  `Mob.discard()` followed by `setHealth(0)` on the original as part of the
  control path's rebuild. It does this with or without `set.*` options, and logs
  nothing at all - the only visible symptom is the summon message.
- **In Control 10.2.7** - works, but its spawner has no biome filter.
  `SpawnerConditions` covers dimension, distance, height, day count, liquid and
  mob caps; `PositionCheck` adds cave, structure, light, time, season and sky.
  Biome conditions exist only on `spawn.json` rules, which can allow or deny a
  spawn the game already attempts but cannot create one. So it can spawn per
  dimension, never per biome.

**Gamerules were not the problem, and are worth ruling out first.** Parse them
straight out of the save rather than trusting the menu: `doMobSpawning`,
`doInsomnia`, `Difficulty` and `DifficultyLocked` all live in
`saves/<world>/level.dat`, gzipped NBT, with gamerule values stored as strings.

---

## Effects

**Read the category from bytecode, never the name.** Each effect class's
constructor passes a `MobEffectCategory`. Several mods mix all three in one
registry, and Kaleidoscope Cookery registers *everything* as BENEFICIAL because
its `BaseEffect(int)` constructor hardcodes it — including Hinder and Flatulence.

**Effect ids come from the ProbeJS dump**, which is the only complete list:
`.probe/@special/types/index.d.ts`, the `type MobEffect = ...` union. 152 here.
**That dump is not currently on disk** — `.probe/` holds only `source_jars`, so
regenerate it in game (ProbeJS 8.0.3 is installed) before relying on the path.

Compiled results:
[BENEFICIAL_EFFECTS.md](chunkbound_info/BENEFICIAL_EFFECTS.md)
(also published to the repo wiki).

---

## Bountiful

Bounties are **generated**, not authored. A *decree* is the category item a board
draws from; a *bounty* is what the generator produces from that decree's pools.
`initialCountPreference` and `fillerCountPreference` in `config/bountiful/bountiful.json`
are both **1-2**, so one bounty is at most two objectives against two rewards.
`BountyCreator` builds one side, takes the bounty's rarity from the highest-rarity
initial entry, then fills the other side to matching worth. So the two sides don't
need equal ceilings - their *worth ranges* just have to overlap, allowing up to two
entries each.

**Decrees merge by id, pools merge by filename.** `Decree.merged` does a set union
on `objectives` and `rewards` keyed by the filename, gated by `replace`. A file at
`bounty_decrees/<anything>/butcher.json` therefore *adds* pools to Bountiful's own
butcher decree rather than replacing it. Same for pools: Bountiful ships
`bounty_pools/farmersdelight/chef_rews.json` and `bounty_pools/supplementaries/chef_rews.json`,
two files feeding one pool named `chef_rews`. Use a fresh filename for a new decree
(ours is `cobblemon.json`), an existing one to extend.

`canSpawn`, `canReveal` and `canWanderBuy` all default to **true**, so a decree with
no `linkedProfessions` still reaches players.

**Objective display names come from `name`, not lang.** `getTranslation()` keys off
`contentToTranslationKey()` - the entry's *`content`* with `:` and `/` replaced by
`.` - so every objective sharing a trigger collapses onto one key. Eighteen
`cobblemon:catch_pokemon` objectives cannot have eighteen different lang strings;
they all render as "Catch_pokemon". `BountyTypeCriteria.textOnBounty` checks
`entry.getName()` first and only falls back to the translation, so set `name` per
entry. (CobbledBounties ships `bountiful.entry.<entryId>` keys that do nothing for
this reason.) Decree names *are* id-keyed, so `bountiful.decree.<id>.name` works -
that one belongs in CBResources, being a resource.

### Never use a Cobblemon trigger in a `criteria` objective

**This hard-crashes the game.** Bountiful's `criteria` objective builds
`{"trigger": content, "conditions": conditions}` and decodes it with vanilla's
`Criterion.CODEC`, so `content` must be a registered criterion trigger and
`conditions` is ordinary advancement-criterion JSON. To decide whether a firing
trigger matches an objective, `registerCriterionStuff` compares
`trigger.getClass()`. That is fine for vanilla, where each trigger has its own
class - but **all 19 of Cobblemon's triggers are instances of one class**,
`com.cobblemon.mod.common.advancement.criterion.SimpleCriterionTrigger`. So *any*
Cobblemon trigger firing gets matched against *any* Cobblemon criteria objective,
and the predicate is applied to a condition decoded for a different trigger.

Every Cobblemon condition class then casts its context unguarded:

| Objective's trigger | Condition class | Casts context to |
|---|---|---|
| `catch_pokemon` | `CaughtPokemonCriterion` | `CountablePokemonTypeContext` |
| `pokemon_defeated`, `catch_shiny_pokemon` | `CountableCriterion` | `CountableContext` |

Winning a battle fires `pokemon_defeated` with a plain `CountableContext`; held
against a `catch_pokemon` objective that cast fails, the exception escapes
`PokemonBattle.tick`, and Showdown is left mid-write - the visible crash is a Graal
`TypeError: Cannot read property 'write' of undefined`, which points at Cobblemon
and hides the real cause. Look for the `ClassCastException` earlier in the log.

Dropping only the catch objectives does **not** help: `CountableContext` is not a
supertype of `Pokemon`, `LevelUpContext`, `EvolvePokemonContext` and the rest, so a
`pokemon_defeated` objective crashes on a level-up or an evolution instead. Kambrik
guards this with `isSubclassOf` in `testAgainst`, but that is only on its `handlers`
list; Bountiful registers via `subscribe()` and takes the unguarded `subscribers`
path.

**Safe ways to express Cobblemon objectives**, all used in `cobblemon_objs.json`:

- `"type": "entity"` with `"content": "cobblemon:pokemon"` - Bountiful's own kill
  hook, never touches the criteria system. No species detail.
- `"type": "criteria"` on **`minecraft:player_killed_entity`** - vanilla
  `KilledTrigger` is a different class, so Cobblemon triggers cannot class-match it.
  Filter species with an NBT predicate on the entity:
  `{"entity": {"type": "cobblemon:pokemon", "nbt": "{Pokemon:{Species:\"cobblemon:tauros\"}}"}}`.
  Species lives directly in the `Pokemon` compound; verify with
  `/data get entity @e[type=cobblemon:pokemon,limit=1,sort=nearest]`.
- `"type": "item"` / `"item_tag"` deliveries.

Note all of these track **killing** a Pokemon, never a battle defeat -
`PokemonEntity` does not override `die()`, so weapon kills go through vanilla kill
attribution while battle faints go through `recallWithAnimation()`/`remove()` and
fire nothing vanilla. Type-filtered *catching* is unreachable from Bountiful; that
belongs in **Cobblemon Quests**, whose `CobblemonTask` has `pokemons`,
`pokemonTypes` and an `actions` list including `defeat` (battle) and `kill`
(entity death), driven off `CobblemonEvents.BATTLE_VICTORY`.

Cobblemon reference values, read from the jar rather than guessed: EXP candy yields
are XS 100, S 800, M 3000, L 10000, XL 30000 (`CandyItem.DEFAULT_*_CANDY_YIELD`),
and Rare Candy calls `getExperienceToNextLevel()` - one level, so 721 exp at lv15
but 7651 at lv50. Levels are cubic, so lv1->15 costs *less* than lv15->20; price
candy against a mid-level target, not a fresh one.

---

## Git & repo conventions

- `main` is the working branch. Commit and push only when asked.
- `emi.json`, `minecraftinstance.json` and `options.txt` are **untracked** —
  each is rewritten every launch with per-user state. `minecraftinstance.json`
  was tracked until it was noticed that it carries the installing machine's
  `installPath`, `guid`, `playedCount` and `timePlayed`, so every pull rewrote
  one contributor's manifest with another's; it also blocked pulls outright
  whenever an incoming commit touched it. The cost is that a fresh clone is not
  auto-detected as a CurseForge instance — create one on NeoForge 21.1.248 and
  point it at the folder; `mods/` still supplies the jars.
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

**Adding a mod: triage its generated config before doing anything else.** Every
new mod drops files into `config/` on first launch. Decide each one:

- **Contains toggles** — settings a pack author would plausibly tune (rates,
  feature switches, balance numbers, mod-preference lists): **track it.**
- **Pure regenerated runtime state** — no authored values, just whatever the
  mod recomputes each launch: **gitignore it**, in the "mods rewrite on every
  launch" block, alphabetically.

Being rewritten every launch is *not* the test on its own — nearly all of them
are, which is what the CRLF churn is about. The test is whether a human would
ever want a value in there to reach a clone.

**One carve-out, from `flywheel-client.toml`:** a file that has toggles but also
embeds a *machine-derived* value gets gitignored anyway, because it produces a
diff on every machine no matter what. Flywheel's is
`defineInRange("workerThreads", -1, -1, Runtime.getRuntime().availableProcessors())`,
so NeoForge writes `# Range: -1 ~ <this host's CPU count>` into the file and it
churned 16 -> 32 -> 16 -> 32 -> 6 across four commits without ever carrying a
real edit. Static bounds like `# Range: -1 ~ 100` are fine — the disqualifier is
specifically a bound computed from the host. Confirm by reading the mod's
`ModConfigSpec` builder in the jar, not by eyeballing the comment.

Check line endings at the same time: if the new config is CRLF on disk, its
path pattern needs an `eol=crlf` rule in `.gitattributes` (see below).

### Line endings

Every blob in the repo is **LF**. `.gitattributes` is `* text=auto eol=lf`, with
`eol=crlf` overrides for the paths whose writers emit Windows endings — all
`config/**/*.toml` (NeoForge's config writer), all `*.snbt` (FTB), plus
`xaerohud.txt`, `badoptimizations.txt` and `defaultoptions/options.txt`. `eol`
only affects the working directory; `text=auto` still normalizes to LF on commit.

The point is to make checkout write exactly what the mods write. When it doesn't,
files show as **modified with a completely empty `git diff`**: git records the
on-disk size at checkout, the mod rewrites the file with different endings, the
size shifts by one byte per line, and `ie_modified()` returns "changed" on the
size mismatch *without hashing* — while `diff` applies the CRLF filter and finds
nothing. `git update-index --refresh` will not clear it.

Diagnose by comparing the recorded size to the real one — the delta equals the
line count exactly:

```bash
git ls-files --debug config/terrablender.toml | grep size   # index
wc -c < config/terrablender.toml                            # disk
```

`git add` on the affected files clears it (content is identical, so nothing
stages — it just refreshes the stat cache). The durable fix is the `eol=crlf`
rule, which is what keeps a fresh clone from hitting it once.

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

**Delete its config files too.** `config/` should hold nothing but files a
currently-installed mod reads. A departed mod's leftovers are dead weight that
later reads as real setup — `config/emi_loot_config.toml` sat here long after
EMI Loot was gone and was mistaken for the source of the loot tabs, which
actually come from AdvancedLootInfo. Remove the config alongside the jar, in the
same commit, and drop its `.gitignore` entry if it had one. Look wider than
`config/<modid>.*`: mods also write `config/<modid>/` directories,
`<modid>-client.toml` / `-common.toml` / `-server.toml` triples, and files under
another mod's namespace, so list what the jar actually created rather than
guessing from the id.

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

# the GitHub CLI is installed but NOT on PATH
GH="/c/Program Files/GitHub CLI/gh.exe"; "$GH" issue list

# vanilla reference data (loot tables, tags) - authoritative for 1.21.1
unzip -p "$MC_INSTALL/versions/1.21.1/1.21.1.jar" data/minecraft/loot_table/entities/drowned.json

# group launch errors by cause instead of reading 600 lines
grep "Parsing error loading recipe" logs/latest.log \
  | sed -E 's/.*JsonParseException: //' | sort | uniq -c | sort -rn
```
