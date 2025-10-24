#!/usr/bin/env python3
"""
Script pour générer des icônes SVG simples pour la PWA EMT Madrid
"""

import os

# Tailles d'icônes à générer
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Template SVG avec un bus stylisé
SVG_TEMPLATE = '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{size}" height="{size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Fond bleu -->
    <rect width="100" height="100" fill="#2563eb" rx="20"/>

    <!-- Bus simplifié (blanc) -->
    <g transform="translate(20, 25)">
        <!-- Corps du bus -->
        <rect x="0" y="10" width="60" height="40" rx="5" fill="white"/>

        <!-- Pare-brise avant -->
        <rect x="45" y="15" width="12" height="15" rx="2" fill="#2563eb"/>

        <!-- Fenêtres -->
        <rect x="5" y="15" width="12" height="12" rx="1" fill="#2563eb"/>
        <rect x="20" y="15" width="12" height="12" rx="1" fill="#2563eb"/>

        <!-- Roues -->
        <circle cx="12" cy="52" r="5" fill="#1e40af"/>
        <circle cx="48" cy="52" r="5" fill="#1e40af"/>

        <!-- Phares -->
        <circle cx="54" cy="25" r="2" fill="#fbbf24"/>

        <!-- Porte -->
        <rect x="32" y="30" width="8" height="20" rx="1" fill="#2563eb"/>
    </g>
</svg>
'''

def generate_icons():
    """Générer toutes les icônes"""
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for size in SIZES:
        svg_content = SVG_TEMPLATE.format(size=size)
        filename = f"icon-{size}.png.svg"
        filepath = os.path.join(script_dir, filename)

        with open(filepath, 'w') as f:
            f.write(svg_content)

        print(f"✓ Icône générée: {filename}")

    print(f"\n{len(SIZES)} icônes SVG générées avec succès!")
    print("\nNote: Les fichiers .svg peuvent être utilisés directement.")
    print("Pour de vraies icônes PNG, utilisez un outil comme ImageMagick ou Inkscape.")
    print("\nExemple avec ImageMagick:")
    print("  for size in 72 96 128 144 152 192 384 512; do")
    print("    convert icon-${size}.png.svg -resize ${size}x${size} icon-${size}.png")
    print("  done")

if __name__ == "__main__":
    generate_icons()
