"""Minimal PNG read/write, standard library only.

Enough for Minecraft assets, which include 4-bit indexed PNGs that a naive
8-bit-only reader silently fails on.
"""
import struct
import zlib


def _unfilter(raw, w, h, bpp):
    return _unfilter_stride(raw, w * bpp, h, bpp)


def _unfilter_stride(raw, stride, h, bpp):
    out = bytearray(stride * h)
    prev = bytearray(stride)
    pos = 0
    for y in range(h):
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
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return out


def read(data):
    """Return (w, h, rows) where rows is a list of rows of (r, g, b, a)."""
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not a png')
    pos = 8
    idat = bytearray()
    plte = trns = None
    w = h = depth = ctype = None
    while pos < len(data):
        ln, typ = struct.unpack('>I4s', data[pos:pos + 8])
        pos += 8
        body = data[pos:pos + ln]
        pos += ln + 4
        if typ == b'IHDR':
            w, h, depth, ctype = struct.unpack('>IIBB', body[:10])
        elif typ == b'PLTE':
            plte = body
        elif typ == b'tRNS':
            trns = body
        elif typ == b'IDAT':
            idat += body
        elif typ == b'IEND':
            break

    nch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    if depth < 8:
        if ctype not in (0, 3):
            raise ValueError(f'bit depth {depth} unsupported for colour type {ctype}')
        stride = (w * depth + 7) // 8
        flat = _unfilter_stride(zlib.decompress(bytes(idat)), stride, h, 1)
        maxv = (1 << depth) - 1
        raw = bytearray(w * h)
        for y in range(h):
            base = y * stride
            for x in range(w):
                bit = x * depth
                v = (flat[base + (bit >> 3)] >> (8 - depth - (bit & 7))) & maxv
                raw[y * w + x] = v if ctype == 3 else v * 255 // maxv
    elif depth == 8:
        raw = _unfilter(zlib.decompress(bytes(idat)), w, h, nch)
    else:
        raise ValueError(f'unsupported bit depth {depth}')

    rows = []
    for y in range(h):
        row = []
        base = y * w * nch
        for x in range(w):
            i = base + x * nch
            if ctype == 6:
                row.append(tuple(raw[i:i + 4]))
            elif ctype == 2:
                row.append((raw[i], raw[i + 1], raw[i + 2], 255))
            elif ctype == 0:
                g = raw[i]
                row.append((g, g, g, 255))
            elif ctype == 4:
                g = raw[i]
                row.append((g, g, g, raw[i + 1]))
            else:
                idx = raw[i]
                r, g, b = plte[idx * 3:idx * 3 + 3]
                a = trns[idx] if (trns and idx < len(trns)) else 255
                row.append((r, g, b, a))
        rows.append(row)
    return w, h, rows


def write(path, rows):
    """rows: list of rows of (r, g, b, a). Writes 8-bit RGBA."""
    h = len(rows)
    w = len(rows[0])
    raw = bytearray()
    for row in rows:
        raw.append(0)
        for px in row:
            raw += bytes(px)

    def chunk(typ, body):
        return (struct.pack('>I', len(body)) + typ + body
                + struct.pack('>I', zlib.crc32(typ + body) & 0xFFFFFFFF))

    out = b'\x89PNG\r\n\x1a\n'
    out += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    out += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    out += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(out)


def avg_color(rows, alpha_min=200):
    """Average of sufficiently opaque pixels, or None if there are none."""
    r = g = b = n = 0
    for row in rows:
        for px in row:
            if px[3] >= alpha_min:
                r += px[0]
                g += px[1]
                b += px[2]
                n += 1
    return (r // n, g // n, b // n) if n else None
