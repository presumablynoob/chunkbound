#!/usr/bin/env python3
"""Rebuild BIOME_SPRITES.md: every modded biome, its current sprite, its screenshot.

Reads the pack itself, so the table always reflects reality rather than drifting:

  - biome ids come from data/<mod>/worldgen/biome/*.json inside the mod jars
  - current sprites come from the CBResources resourcepack, upscaled 4x so they
    are visible in a markdown viewer (16x16 is too small to see otherwise)
  - biomes with no sprite show emi_ores' own missing.png, the placeholder EMI
    actually displays for them
  - screenshots come from biome-sprites/shots/<mod>/<biome>.png, produced by
    downsize_screenshots.py

Standard library only. Run it after adding sprites or screenshots:

    python build_biome_doc.py
"""
import json
import os
import re

import jars
import minipng

HERE = os.path.dirname(os.path.abspath(__file__))
INFO = os.path.dirname(HERE)                    # chunkbound_info/
INST = os.path.dirname(INFO)                    # instance root
PACK = os.path.join(INST, 'config', 'paxi', 'resourcepacks', 'CBResources', 'assets')
DOCDIR = os.path.join(INFO, 'biome-sprites')
CURDIR = os.path.join(DOCDIR, 'current')        # 4x sprite previews
SHOTDIR = os.path.join(DOCDIR, 'screenshots')   # full-res originals, untracked
DISPDIR = os.path.join(DOCDIR, 'shots')         # 240px display copies, tracked
MD = os.path.join(INFO, 'BIOME_SPRITES.md')

# namespaces whose biome art is ours to manage (vanilla's is shipped by emi_ores)
NAMESPACES = ['biomesoplenty', 'regions_unexplored', 'biomeswevegone', 'spawn']

MOD_LABEL = {
    'biomesoplenty': "Biomes O' Plenty",
    'regions_unexplored': 'Regions Unexplored',
    'biomeswevegone': "Oh The Biomes We've Gone",
    'spawn': 'Spawn',
}

IMG_EXTS = ('.png', '.jpg', '.jpeg', '.webp')
SCALE = 4


def biomes_for(ns):
    """Every biome id the mod registers, read from its jar."""
    jars._load()
    pat = re.compile(rf'^data/{re.escape(ns)}/worldgen/biome/(.+)\.json$')
    out = set()
    for z in jars._zips:
        for n in z.namelist():
            m = pat.match(n)
            if m:
                out.add(m.group(1))
    return sorted(out)


def upscale(src_bytes, dest):
    w, h, rows = minipng.read(src_bytes)
    big = []
    for row in rows:
        line = []
        for px in row:
            line.extend([px] * SCALE)
        for _ in range(SCALE):
            big.append(list(line))
    minipng.write(dest, big)


def rel(p):
    return os.path.relpath(p, INFO).replace('\\', '/')


def disabled_biomes():
    """BWG lets its config switch biomes off; they stay registered (so EMI still
    lists them) but never generate. Worth flagging in the table."""
    out = set()
    cfg = os.path.join(INST, 'config', 'biomeswevegone', 'world_generation.json')
    if os.path.exists(cfg):
        try:
            with open(cfg, encoding='utf-8') as f:
                for k, v in json.load(f).get('biomes', {}).items():
                    if not v:
                        out.add(k)
        except Exception:
            pass
    return out


def main():
    for d in (CURDIR, SHOTDIR, DISPDIR):
        os.makedirs(d, exist_ok=True)
    for ns in NAMESPACES:
        os.makedirs(os.path.join(SHOTDIR, ns), exist_ok=True)

    valid_by_ns = {ns: set(biomes_for(ns)) for ns in NAMESPACES}

    # a screenshot whose filename is not a biome id would silently never appear
    orphans = []
    for ns in NAMESPACES:
        d = os.path.join(SHOTDIR, ns)
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            stem, ext = os.path.splitext(f)
            if ext.lower() in IMG_EXTS and stem not in valid_by_ns[ns]:
                orphans.append(f'{ns}/{f}')

    missing_png = jars.get('assets/emi_ores/textures/biome/missing.png')
    if not missing_png:
        raise SystemExit('could not read emi_ores missing.png - is the mod installed?')
    upscale(missing_png, os.path.join(CURDIR, '_missing.png'))

    disabled = disabled_biomes()

    head = [
        '# Biome thumbnails for EMI\n',
        'Every modded biome EMI lists, its sprite as it stands today, and a slot '
        'for an in-game screenshot to redraw it from.\n',
        '`emi_ores` adds all biomes to the EMI index and looks for a 16x16 sprite '
        'at `assets/<namespace>/textures/biome/<name>.png`. With none present it '
        'falls back to `emi_ores:biome/missing`, the checkerboard below.\n',
        'Sprites are shown at 4x. Reference screenshots are shown at 240px; the '
        'full-resolution originals are kept locally in '
        '`biome-sprites/screenshots/<mod>/<biome>.png` and are deliberately not '
        'tracked in git.\n',
        'Regenerate with `python tools/build_biome_doc.py` after adding sprites, '
        'or `python tools/downsize_screenshots.py` after adding screenshots.\n',
    ]

    totals, body, shot_count = [], [], 0
    for ns in NAMESPACES:
        names = sorted(valid_by_ns[ns])
        if not names:
            continue
        have = 0
        rows = []
        for name in names:
            src = os.path.join(PACK, ns, 'textures', 'biome', name + '.png')
            key = f'{ns}__{name}'
            if os.path.exists(src):
                with open(src, 'rb') as f:
                    upscale(f.read(), os.path.join(CURDIR, key + '.png'))
                cur = f'![]({rel(CURDIR)}/{key}.png)'
                have += 1
            else:
                cur = f'![]({rel(CURDIR)}/_missing.png)'

            shot = ''
            for ext in IMG_EXTS:
                p = os.path.join(DISPDIR, ns, name + ext)
                if os.path.exists(p):
                    shot = f'![]({rel(DISPDIR)}/{ns}/{name}{ext})'
                    shot_count += 1
                    break

            note = ' **(disabled in config — does not generate)**' \
                if f'{ns}:{name}' in disabled else ''
            rows.append(f'| `{ns}:{name}`{note} | {cur} | {shot} |')

        totals.append((ns, len(names), have))
        body.append(f'\n## {MOD_LABEL.get(ns, ns)} — `{ns}`\n')
        body.append(f'{have} of {len(names)} have a sprite.\n')
        body.append('| Biome | Current sprite | Screenshot |')
        body.append('|---|---|---|')
        body.extend(rows)

    grand = sum(t[1] for t in totals)
    got = sum(t[2] for t in totals)
    head.append(f'\n**{got} of {grand} modded biomes have a sprite; '
                f'{grand - got} still fall back to `missing.png`.**\n')
    head.append('| Mod | Biomes | With sprite | Missing |')
    head.append('|---|---:|---:|---:|')
    for ns, n, h in totals:
        head.append(f'| {MOD_LABEL.get(ns, ns)} | {n} | {h} | {n - h} |')

    with open(MD, 'w', encoding='utf-8') as f:
        f.write('\n'.join(head + body) + '\n')

    print(f'wrote {rel(MD)}')
    print(f'  {grand} biomes, {got} with sprites, {shot_count} with screenshots')
    if orphans:
        print(f'  WARNING: {len(orphans)} screenshot(s) match no registered biome id:')
        for o in orphans:
            print(f'    {o}')


if __name__ == '__main__':
    main()
