#!/usr/bin/env python3
"""Render görsellerini siteye hazırlar.

projects/<id>/renders/ içine bırakılan PNG/JPG dosyalarını WebP'ye çevirir:
  <ad>.webp       uzun kenarı en çok 2400 px (masaüstü)
  <ad>-small.webp yarı boyut (telefon)
Asıl dosya renders/originals/ altına taşınır (git'e girmez). Sonunda project.json'a
yapıştırılacak "render" alanlarını yazar.

Kullanım: python3 tools/optimize-renders.py [proje-id]   (varsayılan: meridyen)
Gerekli: Pillow (pip install pillow)
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

LONG_EDGE = 2400
QUALITY = 82
SOURCE_TYPES = {'.png', '.jpg', '.jpeg'}


def save_webp(image, path, long_edge):
    copy = image.copy()
    copy.thumbnail((long_edge, long_edge), Image.LANCZOS)
    copy.save(path, 'WEBP', quality=QUALITY, method=6)
    return copy.size


def main():
    project_id = sys.argv[1] if len(sys.argv) > 1 else 'meridyen'
    folder = Path(__file__).resolve().parent.parent / 'projects' / project_id / 'renders'
    originals = folder / 'originals'
    sources = sorted(p for p in folder.iterdir() if p.suffix.lower() in SOURCE_TYPES) if folder.exists() else []
    if not sources:
        print(f'{folder} içinde çevrilecek PNG/JPG yok.')
        return

    originals.mkdir(exist_ok=True)
    snippets = {}
    for source in sources:
        name = source.stem.lower()
        image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
        size = save_webp(image, folder / f'{name}.webp', LONG_EDGE)
        save_webp(image, folder / f'{name}-small.webp', max(size) // 2)
        source.rename(originals / source.name)
        kb = (folder / f'{name}.webp').stat().st_size // 1024
        small_kb = (folder / f'{name}-small.webp').stat().st_size // 1024
        print(f'{source.name} → {name}.webp {size[0]}×{size[1]} ({kb} KB), {name}-small.webp ({small_kb} KB)')
        snippets[name] = {'src': f'renders/{name}.webp', 'small': f'renders/{name}-small.webp', 'size': list(size)}

    print('\nproject.json için:')
    for name, render in snippets.items():
        print(f'  {name}: "render": {json.dumps(render, ensure_ascii=False)}')


if __name__ == '__main__':
    main()
