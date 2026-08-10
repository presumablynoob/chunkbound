"""Read data and assets out of the pack's mod jars (and the vanilla client jar).

Paths are derived from this file's location, so the tools keep working in a
clone on another machine.
"""
import glob
import json
import os
import zipfile

import minipng

HERE = os.path.dirname(os.path.abspath(__file__))
INST = os.path.dirname(os.path.dirname(HERE))      # tools/ -> chunkbound_info/ -> instance
MODS = os.path.join(INST, 'mods')


def _find_client_jar():
    """Locate the vanilla client jar, which ships colormaps and block textures.

    Optional: everything except vanilla-block colour sampling works without it.
    Set MC_CLIENT_JAR to override.
    """
    env = os.environ.get('MC_CLIENT_JAR')
    if env and os.path.exists(env):
        return env
    roots = [
        os.path.join(INST, '..', '..', 'Install', 'versions'),   # CurseForge
        os.path.join(os.path.expanduser('~'), 'AppData', 'Roaming', '.minecraft', 'versions'),
        os.path.join(os.path.expanduser('~'), '.minecraft', 'versions'),
    ]
    for root in roots:
        for jar in sorted(glob.glob(os.path.join(root, '1.21*', '1.21*.jar')), reverse=True):
            return jar
    return None


CLIENT_JAR = _find_client_jar()

_zips = []
_index = {}


def _load():
    if _zips:
        return
    paths = ([CLIENT_JAR] if CLIENT_JAR else []) + sorted(
        glob.glob(os.path.join(MODS, '*.jar')))
    for p in paths:
        try:
            z = zipfile.ZipFile(p)
        except Exception:
            continue
        _zips.append(z)
        for n in z.namelist():
            if n.endswith('.json') or n.endswith('.png'):
                _index.setdefault(n, (z, n))


def get(path):
    _load()
    hit = _index.get(path)
    if not hit:
        return None
    z, n = hit
    return z.read(n)


def get_json(path):
    b = get(path)
    return json.loads(b) if b else None


def rl(idstr, default_ns='minecraft'):
    return idstr.split(':', 1) if ':' in idstr else (default_ns, idstr)


_color_cache = {}

# blocks whose texture file is not named after the block
ALIAS = {
    'snow_block': 'snow',
    'grass_block': 'grass_block_top',
    'mycelium': 'mycelium_top',
    'podzol': 'podzol_top',
    'water': 'water_still',
    'lava': 'lava_still',
}

# colour-variant prefixes that share one base texture
VARIANT_PREFIXES = ('sky_', 'lavender_', 'salmon_', 'purple_', 'blue_', 'green_',
                    'pink_', 'red_', 'yellow_', 'orange_', 'white_', 'brown_',
                    'golden_', 'silver_', 'light_', 'dark_', 'cyan_', 'magenta_')


def block_color(block_id):
    """Average colour of a block's texture, sampled from whichever jar ships it."""
    if block_id in _color_cache:
        return _color_cache[block_id]
    ns, path = rl(block_id)
    names = [ALIAS.get(path, path)]
    if path not in ALIAS:
        names.append(path)
    for p in VARIANT_PREFIXES:
        if path.startswith(p):
            names.append(path[len(p):])
    cands = []
    for nm in names:
        cands += [
            f'assets/{ns}/textures/block/{nm}.png',
            f'assets/{ns}/textures/block/{nm}_top.png',
            f'assets/{ns}/textures/block/{nm}_side.png',
            f'assets/{ns}/textures/block/{nm}_0.png',
            f'assets/{ns}/textures/block/{nm}_stage0.png',
        ]
        if nm.endswith('_log'):
            cands.append(f'assets/{ns}/textures/block/{nm[:-4]}_wood.png')
    col = None
    for c in cands:
        raw = get(c)
        if raw:
            try:
                w, h, rows = minipng.read(raw)
                if h > w:              # animated strip: use the first frame
                    rows = rows[:w]
                col = minipng.avg_color(rows)
            except Exception:
                col = None
            if col:
                break
    _color_cache[block_id] = col
    return col
