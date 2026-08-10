#!/usr/bin/env python3
"""Downsize biome reference screenshots for BIOME_SPRITES.md.

Reads  chunkbound_info/biome-sprites/screenshots/<mod>/<biome>.png   (full-res, untracked)
Writes chunkbound_info/biome-sprites/shots/<mod>/<biome>.png         (240px wide, committed)

Full-resolution Minecraft screenshots are ~8 MB each; at 212 biomes that is
~450 MB, far too much for the repo (which already needs Git LFS for one mod
jar). The 240px copies total a few MB and are all a 16x16 sprite needs.

Standard library only - no Pillow, nothing to install. Decoding a 1920x1080 PNG
in pure Python takes a few seconds, so the script skips files whose output is
already newer than its input; only new or changed screenshots are processed.

Usage:
    python downsize_screenshots.py              # process anything out of date
    python downsize_screenshots.py --force      # rebuild everything
    python downsize_screenshots.py --width 480  # different display width
"""
import argparse
import os
import struct
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(os.path.dirname(HERE), 'biome-sprites')
SRC = os.path.join(BASE, 'screenshots')
DST = os.path.join(BASE, 'shots')
DEFAULT_WIDTH = 240

EXTS = ('.png',)


# --------------------------------------------------------------------- decode
def _unfilter(raw, stride, height, bpp):
    """Reverse the per-scanline PNG filters into a flat bytearray."""
    out = bytearray(stride * height)
    prev = bytearray(stride)
    pos = 0
    for y in range(height):
        ft = raw[pos]
        pos += 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride
        if ft == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 0xFF
        elif ft == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ft == 3:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif ft == 4:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                c = prev[i - bpp] if i >= bpp else 0
                b = prev[i]
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                if pa <= pb and pa <= pc:
                    pr = a
                elif pb <= pc:
                    pr = b
                else:
                    pr = c
                line[i] = (line[i] + pr) & 0xFF
        elif ft != 0:
            raise ValueError(f'unknown filter type {ft}')
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return out


def read_rgb(path):
    """Return (width, height, bytearray of RGB triples)."""
    with open(path, 'rb') as f:
        data = f.read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError(f'{path}: not a PNG')
    pos = 8
    idat = bytearray()
    plte = None
    w = h = depth = ctype = None
    while pos < len(data):
        ln, typ = struct.unpack('>I4s', data[pos:pos + 8])
        pos += 8
        body = data[pos:pos + ln]
        pos += ln + 4
        if typ == b'IHDR':
            w, h, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', body[:13])
            if interlace:
                raise ValueError(f'{path}: interlaced PNG not supported')
        elif typ == b'PLTE':
            plte = body
        elif typ == b'IDAT':
            idat += body
        elif typ == b'IEND':
            break

    nch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(bytes(idat))
    if depth == 8:
        stride = w * nch
        flat = _unfilter(raw, stride, h, nch)
    elif depth < 8 and ctype in (0, 3):
        stride = (w * depth + 7) // 8
        packed = _unfilter(raw, stride, h, 1)
        maxv = (1 << depth) - 1
        flat = bytearray(w * h)
        for y in range(h):
            base = y * stride
            for x in range(w):
                bit = x * depth
                v = (packed[base + (bit >> 3)] >> (8 - depth - (bit & 7))) & maxv
                flat[y * w + x] = v if ctype == 3 else v * 255 // maxv
        nch = 1
    else:
        raise ValueError(f'{path}: unsupported bit depth {depth} / colour type {ctype}')

    # normalise to RGB
    rgb = bytearray(w * h * 3)
    if ctype == 2 and depth == 8:
        for i in range(w * h):
            rgb[i * 3:i * 3 + 3] = flat[i * 3:i * 3 + 3]
    elif ctype == 6 and depth == 8:
        for i in range(w * h):
            rgb[i * 3:i * 3 + 3] = flat[i * 4:i * 4 + 3]
    elif ctype == 3:
        for i in range(w * h):
            p = flat[i] * 3
            rgb[i * 3:i * 3 + 3] = plte[p:p + 3]
    elif ctype in (0, 4):
        step = 1 if ctype == 0 else 2
        for i in range(w * h):
            g = flat[i * step]
            rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = g
    return w, h, rgb


# ------------------------------------------------------------------- resample
def box_downscale(w, h, rgb, out_w):
    """Average each source block into one output pixel."""
    out_h = max(1, round(h * out_w / w))
    out = bytearray(out_w * out_h * 3)
    for oy in range(out_h):
        y0 = oy * h // out_h
        y1 = max(y0 + 1, (oy + 1) * h // out_h)
        for ox in range(out_w):
            x0 = ox * w // out_w
            x1 = max(x0 + 1, (ox + 1) * w // out_w)
            r = g = b = 0
            n = (y1 - y0) * (x1 - x0)
            for sy in range(y0, y1):
                base = (sy * w + x0) * 3
                for _ in range(x1 - x0):
                    r += rgb[base]
                    g += rgb[base + 1]
                    b += rgb[base + 2]
                    base += 3
            o = (oy * out_w + ox) * 3
            out[o] = r // n
            out[o + 1] = g // n
            out[o + 2] = b // n
    return out_w, out_h, out


# ---------------------------------------------------------------------- write
def write_rgb(path, w, h, rgb):
    raw = bytearray()
    for y in range(h):
        raw.append(0)                       # filter type 0 (None)
        raw += rgb[y * w * 3:(y + 1) * w * 3]

    def chunk(typ, body):
        return (struct.pack('>I', len(body)) + typ + body
                + struct.pack('>I', zlib.crc32(typ + body) & 0xFFFFFFFF))

    out = b'\x89PNG\r\n\x1a\n'
    out += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    out += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    out += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--width', type=int, default=DEFAULT_WIDTH)
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()

    if not os.path.isdir(SRC):
        sys.exit(f'no screenshots directory at {SRC}')

    written = skipped = 0
    for mod in sorted(os.listdir(SRC)):
        mod_dir = os.path.join(SRC, mod)
        if not os.path.isdir(mod_dir):
            continue
        out_dir = os.path.join(DST, mod)
        os.makedirs(out_dir, exist_ok=True)
        for fn in sorted(os.listdir(mod_dir)):
            if not fn.lower().endswith(EXTS):
                continue
            src = os.path.join(mod_dir, fn)
            dst = os.path.join(out_dir, os.path.splitext(fn)[0] + '.png')
            # A file in shots/ that is far bigger than a thumbnail means a
            # full-res screenshot was dropped into the output folder by mistake.
            # Rebuild it rather than skipping it forever on the mtime check.
            oversized = (os.path.exists(dst)
                         and os.path.getsize(dst) > 16 * args.width * args.width)
            if oversized:
                print(f'  ! {mod}/{fn}: shots/ copy looks like a full-res image '
                      f'({os.path.getsize(dst) // 1024} KB) - rebuilding')
            if (not args.force and not oversized and os.path.exists(dst)
                    and os.path.getmtime(dst) > os.path.getmtime(src)):
                skipped += 1
                continue
            w, h, rgb = read_rgb(src)
            ow, oh, small = box_downscale(w, h, rgb, args.width)
            write_rgb(dst, ow, oh, small)
            kb = os.path.getsize(dst) // 1024
            print(f'  {mod}/{os.path.splitext(fn)[0]}  {ow}x{oh}  {kb} KB')
            written += 1
    print(f'done: {written} written, {skipped} already current')


if __name__ == '__main__':
    main()
