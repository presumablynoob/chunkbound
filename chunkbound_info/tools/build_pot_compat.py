#!/usr/bin/env python3
"""Generate the Farm & Charm <-> Farmer's Delight cooking-pot compatibility recipes.

This replaces the runtime recipe synthesis that `letsdocompat` performs through a
`RecipeManagerMixin`. That mod mints its converted recipes under ids that collide
with the originals, which is what produces EMI's "2 recipes loaded with the same
id" errors; the files written here use our own `chunkbound:` namespace instead, so
nothing collides.

Four conversions, all a straight field remap (verified against
`dev.ninjdai.letsdocompat.RecipeJsonUtil` in the letsdocompat jar):

  farm_and_charm:pot_cooking  ->  farmersdelight:cooking
      type, recipe_book_tab="meals", ingredients, result, container (only when
      the source sets requireContainer). cookingtime/experience fall to FD's
      defaults of 200 and 0.

  farmersdelight:cooking      ->  farm_and_charm:pot_cooking
      type, ingredients, result, requireContainer=true, container,
      requiresLearning=false.

  farm_and_charm:crafting_bowl ->  create:mixing
      type, ingredients, results=[result].

  farm_and_charm:mincer        ->  kaleidoscope_cookery:millstone
      type, ingredient, result. KC's millstone is the pack's grinding station,
      so the mincer's grinding recipes are mirrored onto it rather than onto
      Create's millstone.

Both cooking pots hold six ingredient slots, so no recipe is dropped for size.

letsdocompat had a millstone converter of its own, but it targeted Create and
was never registered in `RECIPE_CONVERSION_MAP`, so it never ran.

Only FD recipes that state a `container` outright are converted. FD's
`CookingPotRecipe` constructor fills an omitted container from the *result
item's crafting remainder* — a bowl for anything built with its `bowlFoodItem`
helper, a bottle for `drinkItem` — which is item code a datapack cannot read.
F&C's recipe has no such fallback: it stores `containerRequired` and
`containerItem` verbatim. Emitting `requireContainer: false` for those would let
the F&C pot hand over a bowl of stew without spending a bowl, so they are
skipped and listed instead. All 27 F&C pot recipes state their container, so the
other direction converts in full.

Recipes whose converted form would collide with an existing recipe of the target
type are skipped: those types are modded, so Polymorph does not arbitrate them
and one of the two would silently become unobtainable.

Stdlib only. Paths derive from this file's location.

    python chunkbound_info/tools/build_pot_compat.py
"""

from __future__ import annotations

import collections
import json
import os
import re
import shutil
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODS = os.path.join(ROOT, "mods")
CB = os.path.join(ROOT, "config", "paxi", "datapacks", "CBTweaks", "data")
PROBE = os.path.join(ROOT, ".probe", "source_jars")

OUT_REL = os.path.join("chunkbound", "recipe", "compat")
OUT = os.path.join(CB, OUT_REL)

FC_POT = "farm_and_charm:pot_cooking"
FD_COOKING = "farmersdelight:cooking"
FC_BOWL = "farm_and_charm:crafting_bowl"
FC_MINCER = "farm_and_charm:mincer"
CREATE_MIXING = "create:mixing"
KC_MILLSTONE = "kaleidoscope_cookery:millstone"
CONTAINER_TAG = "farm_and_charm:container"

# Mincer recipes that stay mincer-only and are never given to the millstone.
# Two reasons are mixed here, both deliberate.
MILLING_SKIP_NAMES = frozenset([
    # Not grinding at all - a millstone has no business slicing or shaping.
    "melon_slice",     # melon -> 9 slices
    "raw_pasta",       # dough -> pasta, extruded
    # Butchery. Grinding meat is plausible on a millstone, but the pack keeps
    # all meat processing on the mincer as a matter of taste.
    "bacon",           # porkchop -> bacon
    "chicken_parts",   # chicken -> chicken cuts
    "lamb_ham",        # mutton -> lamb ham
    "minced_beef",     # beef -> minced beef
])
# ...and stripping bark off logs, which is a saw's job - Create's own saw
# already does it, and CCK adds the bark drops to those sawing recipes.
MILLING_SKIP_PREFIX = "stripped_"

SCANNED_TYPES = (
    FC_POT, FD_COOKING, FC_BOWL, FC_MINCER, CREATE_MIXING, KC_MILLSTONE,
)


# --------------------------------------------------------------------------- #
# jars
# --------------------------------------------------------------------------- #

def jar_paths():
    return sorted(
        os.path.join(MODS, f) for f in os.listdir(MODS) if f.endswith(".jar")
    )


def mod_ids(jar):
    """Every modId declared by a jar, so `neoforge:mod_loaded` gates are right."""
    ids = []
    try:
        with zipfile.ZipFile(jar) as z:
            for name in ("META-INF/neoforge.mods.toml", "META-INF/mods.toml"):
                if name in z.namelist():
                    text = z.read(name).decode("utf-8", "ignore")
                    ids += re.findall(r'modId\s*=\s*"([a-z0-9_\-]+)"', text)
    except zipfile.BadZipFile:
        pass
    return ids


# --------------------------------------------------------------------------- #
# tags (jars + NeoForge + CBTweaks, in load order) - only used to compare
# ingredient sets when hunting collisions
# --------------------------------------------------------------------------- #

def build_tags(jars):
    tags = collections.defaultdict(lambda: {"values": [], "remove": []})

    def feed(path, data):
        # 1.21 reads tags/item; mods shipping the legacy tags/items path are
        # normalised here purely so the collision check sees a superset.
        path = path.replace("/tags/items/", "/tags/item/")
        if "/tags/item/" not in path:
            return
        ns = path.split("data/", 1)[1].split("/")[0]
        key = "%s:%s" % (ns, path.split("/tags/item/", 1)[1][: -len(".json")])
        for v in data.get("values", []):
            tags[key]["values"].append(v["id"] if isinstance(v, dict) else v)
        for r in data.get("remove", []):
            tags[key]["remove"].append(r["id"] if isinstance(r, dict) else r)

    sources = list(jars)
    if os.path.isdir(PROBE):
        sources += [
            os.path.join(PROBE, f) for f in os.listdir(PROBE) if f.endswith(".jar")
        ]
    for jar in sources:
        try:
            z = zipfile.ZipFile(jar)
        except (zipfile.BadZipFile, OSError):
            continue
        with z:
            for n in z.namelist():
                if n.startswith("data/") and n.endswith(".json") and "/tags/item" in n:
                    try:
                        feed(n, json.loads(z.read(n)))
                    except (ValueError, KeyError):
                        pass

    for dirpath, _, files in os.walk(CB):
        for f in files:
            if not f.endswith(".json"):
                continue
            p = os.path.join(dirpath, f)
            rel = "data/" + os.path.relpath(p, CB).replace(os.sep, "/")
            if "/tags/item" in rel:
                try:
                    feed(rel, json.load(open(p, encoding="utf-8")))
                except ValueError:
                    pass
    return tags


def resolve(tags, key, seen=None):
    seen = seen or set()
    if key in seen:
        return set()
    seen.add(key)
    entry = tags.get(key)
    if not entry:
        return set()
    out = set()
    for v in dict.fromkeys(entry["values"]):
        if v in entry["remove"]:
            continue
        out |= resolve(tags, v[1:], seen) if v.startswith("#") else {v}
    return out


def ingredient_items(tags, ing):
    if not isinstance(ing, dict):
        return frozenset()
    # Create mixing takes fluid ingredients too; keep them distinguishable so a
    # fluid slot never compares equal to an unresolvable item slot.
    if "fluid" in ing:
        return frozenset(["fluid:" + str(ing["fluid"])])
    if ing.get("type") == "neoforge:tag" and "tag" in ing:
        return frozenset(["fluidtag:" + ing["tag"]])
    if "tag" in ing:
        return frozenset(resolve(tags, ing["tag"]))
    if "item" in ing:
        return frozenset([ing["item"]])
    if ing.get("type") == "neoforge:compound":
        out = set()
        for child in ing.get("children", []):
            out |= ingredient_items(tags, child)
        return frozenset(out)
    if ing.get("type") == "neoforge:difference":
        return frozenset(
            ingredient_items(tags, ing.get("base", {}))
            - ingredient_items(tags, ing.get("subtracted", {}))
        )
    return frozenset()


def signature(tags, recipe):
    """Ingredient multiset, resolved to concrete items.

    Deliberately ignores Create's `heat_requirement`: two basin recipes that
    differ only by heat are not strictly a clash, but flagging them is the safe
    direction - we skip one rather than ship a silent conflict.
    """
    ings = recipe.get("ingredients")
    if ings is None and isinstance(recipe.get("ingredient"), dict):
        ings = [recipe["ingredient"]]  # farm_and_charm:mincer takes one input
    return tuple(
        sorted(tuple(sorted(ingredient_items(tags, i))) for i in (ings or []))
    )


# --------------------------------------------------------------------------- #
# collecting the live recipes
# --------------------------------------------------------------------------- #

def is_disabled(recipe):
    return any(
        c.get("type") == "neoforge:false"
        for c in recipe.get("neoforge:conditions", [])
    )


def conditions_met(recipe, loaded):
    for c in recipe.get("neoforge:conditions", []):
        if c.get("type") == "neoforge:mod_loaded" and c.get("modid") not in loaded:
            return False
    return True


def collect(jars, loaded):
    """Live recipes of every type we read, with any CBTweaks override applied."""
    found = dict((t, {}) for t in SCANNED_TYPES)
    for jar in jars:
        try:
            z = zipfile.ZipFile(jar)
        except (zipfile.BadZipFile, OSError):
            continue
        with z:
            ids = mod_ids(jar)
            for n in z.namelist():
                if not (n.startswith("data/") and "/recipe" in n and n.endswith(".json")):
                    continue
                try:
                    recipe = json.loads(z.read(n))
                except ValueError:
                    continue
                if recipe.get("type") not in found:
                    continue
                key = n[len("data/"):-len(".json")]
                shadow = os.path.join(CB, key + ".json")
                if os.path.exists(shadow):
                    recipe = json.load(open(shadow, encoding="utf-8"))
                    if is_disabled(recipe) or recipe.get("type") not in found:
                        continue
                if not conditions_met(recipe, loaded):
                    continue
                found[recipe.get("type")][key] = (recipe, ids[0] if ids else None)

    # CBTweaks also adds recipes of its own that shadow no jar file - the
    # millstone noodles recipe is one - and they have to be in the collision
    # index or a conversion could silently shadow them.
    for dirpath, _, files in os.walk(CB):
        for f in files:
            if not f.endswith(".json"):
                continue
            p = os.path.join(dirpath, f)
            key = os.path.relpath(p, CB).replace(os.sep, "/")[: -len(".json")]
            try:
                recipe = json.load(open(p, encoding="utf-8"))
            except ValueError:
                continue
            kind = recipe.get("type")
            if kind in found and key not in found[kind] and not is_disabled(recipe):
                found[kind][key] = (recipe, None)
    return found


# --------------------------------------------------------------------------- #
# the two conversions
# --------------------------------------------------------------------------- #

def fc_pot_to_fd_cooking(src):
    out = {
        "type": FD_COOKING,
        "recipe_book_tab": "meals",
        "ingredients": src["ingredients"],
    }
    if src.get("requireContainer") and isinstance(src.get("container"), dict):
        out["container"] = src["container"]
    out["result"] = src["result"]
    return out


def _create_result(result):
    out = {"id": result.get("id") or result.get("item")}
    if result.get("count", 1) != 1:
        out["count"] = result["count"]
    return out


def fc_bowl_to_create_mixing(src):
    return {
        "type": CREATE_MIXING,
        "ingredients": src["ingredients"],
        "results": [_create_result(src["result"])],
    }


def fc_mincer_to_kc_millstone(src):
    result = src["result"]
    return {
        "type": KC_MILLSTONE,
        "ingredient": src["ingredient"],
        "result": {
            "id": result.get("id") or result.get("item"),
            "count": result.get("count", 1),
        },
    }


def fd_cooking_to_fc_pot(src):
    """Only valid when the source states a container; see the module docstring."""
    container = src["container"]
    return {
        "type": FC_POT,
        "ingredients": src["ingredients"],
        "requireContainer": True,
        "container": {
            "id": container.get("id") or container.get("item"),
            "count": container.get("count", 1),
        },
        "result": src["result"],
        "requiresLearning": False,
    }


# --------------------------------------------------------------------------- #
# writing
# --------------------------------------------------------------------------- #

def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, indent=2)
        f.write("\n")


def gate(recipe, mods):
    conds = [{"type": "neoforge:mod_loaded", "modid": m} for m in mods if m]
    if conds:
        return dict([("neoforge:conditions", conds)] + list(recipe.items()))
    return recipe


def main():
    jars = jar_paths()
    loaded = set()
    for jar in jars:
        loaded.update(mod_ids(jar))
    print("scanning %d jars (%d mod ids loaded)" % (len(jars), len(loaded)))

    # Clear last run's output *before* reading tags, or the container additions
    # written previously would be counted as already present and never rewritten.
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    container_file = os.path.join(CB, "farm_and_charm", "tags", "item", "container.json")
    if os.path.exists(container_file):
        os.remove(container_file)

    tags = build_tags(jars)
    recipes = collect(jars, loaded)
    fc = recipes[FC_POT]
    fd = recipes[FD_COOKING]
    for t in SCANNED_TYPES:
        print("live %-28s %d" % (t, len(recipes[t])))

    def index(source):
        by_sig = collections.defaultdict(list)
        for k, (r, _) in source.items():
            by_sig[signature(tags, r)].append(k)
        return by_sig

    fd_sigs = index(fd)
    fc_sigs = index(fc)
    mixing_sigs = index(recipes[CREATE_MIXING])

    # The millstone takes a single item, so *any* shared input is a conflict -
    # comparing whole ingredient sets the way the basin and pot checks do would
    # miss a recipe whose tag merely overlaps another's. Index it per item.
    millstone_claims = collections.defaultdict(list)
    for k, (r, _) in recipes[KC_MILLSTONE].items():
        for item in ingredient_items(tags, r.get("ingredient", {})):
            millstone_claims[item].append(k)

    written, skipped = 0, []

    # F&C pot -> FD cooking pot
    for key, (recipe, modid) in sorted(fc.items()):
        sig = signature(tags, recipe)
        clash = fd_sigs.get(sig)
        if clash:
            skipped.append((key, FD_COOKING, clash))
            continue
        ns, rel = key.split("/", 1)
        rel = rel.split("recipe/", 1)[1]
        out = gate(fc_pot_to_fd_cooking(recipe), ["farmersdelight", modid])
        write_json(os.path.join(OUT, "cooking_pot", ns, rel + ".json"), out)
        # feed it back in, so a later source recipe with the same inputs
        # collides with what we just wrote rather than silently shadowing it
        fd_sigs[sig].append("(generated) " + key)
        written += 1

    # FD cooking pot -> F&C pot
    containers = collections.Counter()
    no_container = []
    for key, (recipe, modid) in sorted(fd.items()):
        sig = signature(tags, recipe)
        clash = fc_sigs.get(sig)
        if clash:
            skipped.append((key, FC_POT, clash))
            continue
        if not isinstance(recipe.get("container"), dict):
            no_container.append((key, recipe.get("result", {}).get("id")))
            continue
        ns, rel = key.split("/", 1)
        rel = rel.split("recipe/", 1)[1]
        converted = fd_cooking_to_fc_pot(recipe)
        containers[converted["container"]["id"]] += 1
        out = gate(converted, ["farm_and_charm", modid])
        write_json(os.path.join(OUT, "pot_cooking", ns, rel + ".json"), out)
        fc_sigs[sig].append("(generated) " + key)
        written += 1

    # F&C crafting bowl -> Create mixer (basin), and F&C mincer -> millstone.
    # Both are automation routes, so a clash with one of Create's own recipes
    # would quietly break a machine; they are skipped and reported instead.
    not_grinding = []
    for source, target, convert, sigs, folder in (
        (recipes[FC_BOWL], CREATE_MIXING, fc_bowl_to_create_mixing,
         mixing_sigs, "mixing"),
        (recipes[FC_MINCER], KC_MILLSTONE, fc_mincer_to_kc_millstone,
         None, "millstone"),
    ):
        for key, (recipe, modid) in sorted(source.items()):
            name = key.rsplit("/", 1)[-1]
            single_input = target == KC_MILLSTONE
            if single_input and (
                name in MILLING_SKIP_NAMES or name.startswith(MILLING_SKIP_PREFIX)
            ):
                not_grinding.append((key, recipe.get("result", {}).get("id")))
                continue
            if single_input:
                items = ingredient_items(tags, recipe.get("ingredient", {}))
                clash = sorted({c for i in items for c in millstone_claims.get(i, [])})
            else:
                sig = signature(tags, recipe)
                clash = sigs.get(sig)
            if clash:
                skipped.append((key, target, clash))
                continue
            ns, rel = key.split("/", 1)
            rel = rel.split("recipe/", 1)[1]
            gate_mod = "create" if target == CREATE_MIXING else "kaleidoscope_cookery"
            out = gate(convert(recipe), [gate_mod, modid])
            write_json(os.path.join(OUT, folder, ns, rel + ".json"), out)
            if single_input:
                for i in items:
                    millstone_claims[i].append("(generated) " + key)
            else:
                sigs[sig].append("(generated) " + key)
            written += 1

    # containers the converted recipes need in the F&C pot's container slot,
    # which the block entity validates against #farm_and_charm:container
    have = resolve(tags, CONTAINER_TAG)
    missing = sorted(c for c in containers if c not in have)
    if missing:
        write_json(
            container_file,
            {"values": [{"id": c, "required": False} for c in missing]},
        )

    print("\nwrote %d recipes to %s" % (written, os.path.join(OUT_REL, "").replace(os.sep, "/")))
    if missing:
        print("added %d container(s) to #%s:" % (len(missing), CONTAINER_TAG))
        for c in missing:
            print("   %-34s (%d recipe(s))" % (c, containers[c]))
    if skipped:
        print("\nskipped %d recipe(s) that would collide with an existing "
              "recipe of the target type:" % len(skipped))
        for key, target, clash in skipped:
            print("   %s\n      -> %s already has %s" % (key, target, ", ".join(clash)))
    # Anything still claimed twice is a pre-existing clash between the mods'
    # own recipes - we did not create it, but the millstone will silently pick
    # one, so say so.
    remaining = sorted(
        (item, sorted(set(names)))
        for item, names in millstone_claims.items()
        if len(set(names)) > 1
    )
    if remaining:
        print("\nWARNING - %d millstone input(s) accepted by more than one recipe;\n"
              "the millstone takes a single item, so one recipe silently wins:"
              % len(remaining))
        for item, names in remaining:
            print("   %-34s %s" % (item, ", ".join(n.split("/")[-1] for n in names)))
    if not_grinding:
        print("\nkept mincer-only (%d) - not grinding, or butchery the pack keeps\n"
              "on the mincer by choice:" % len(not_grinding))
        for key, result in not_grinding:
            print("   %-52s -> %s" % (key, result))
    if no_container:
        print("\nskipped %d FD recipe(s) with no explicit container - FD derives "
              "it\nfrom the result item's crafting remainder at runtime, which a "
              "datapack\ncannot read, and F&C has no such fallback:" % len(no_container))
        for key, result in no_container:
            print("   %-58s -> %s" % (key, result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
