#!/usr/bin/env python3
"""
GENERADOR DE PLAYLIST POR PROGRAMA para Teletext Radio
- Genera un playlist.json dentro de cada carpeta de programa
"""

import os
import json
import random
from pathlib import Path

# Configuración
BASE_DIR = Path(".")
MUSIC_ROOT = BASE_DIR / "music"
PROGRAMS = ["madrugadatxt", "telesoft", "radio404", "especialestxt", "internetarchive", "teletext"]

def obtener_duracion_real(mp3_path):
    """Obtiene duración real del MP3 usando mutagen"""
    try:
        from mutagen.mp3 import MP3
        audio = MP3(mp3_path)
        return int(audio.info.length)
    except ImportError:
        print("⚠️  Instala mutagen: pip install mutagen")
        return 300
    except Exception:
        size_mb = mp3_path.stat().st_size / (1024 * 1024)
        return int(size_mb * 60) if size_mb > 0 else 300

def generar_playlist_para_programa(programa):
    """Genera playlist.json para un programa específico"""
    programa_dir = MUSIC_ROOT / programa
    
    if not programa_dir.exists():
        print(f"❌ Carpeta {programa} no existe")
        return
    
    # Buscar MP3 en esta carpeta
    archivos_mp3 = []
    for ext in ['*.mp3', '*.MP3']:
        archivos_mp3.extend(programa_dir.glob(ext))
    
    if not archivos_mp3:
        print(f"⚠️  No hay MP3 en {programa}")
        return
    
    # Crear tracks
    tracks = []
    duracion_total = 0
    
    for mp3 in archivos_mp3:
        duracion = obtener_duracion_real(mp3)
        tracks.append({
            "file": mp3.name,
            "duration": duracion,
            "url": f"music/{programa}/{mp3.name}"  # Ruta relativa desde index.html
        })
        duracion_total += duracion
    
    # Orden aleatorio FIJO (semilla basada en nombre del programa)
    semilla = sum(ord(c) for c in programa)
    random.seed(semilla)
    random.shuffle(tracks)
    
    # Estructura final
    playlist_data = {
        "version": "1.0",
        "program": programa,
        "total_duration": duracion_total,
        "total_tracks": len(tracks),
        "tracks": tracks
    }
    
    # Guardar dentro de la carpeta del programa
    output_path = programa_dir / "playlist.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(playlist_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {programa}: {len(tracks)} tracks, {duracion_total/3600:.1f}h")

def main():
    print("=" * 60)
    print("GENERADOR DE PLAYLIST POR PROGRAMA - Teletext Radio")
    print("=" * 60)
    
    for programa in PROGRAMS:
        generar_playlist_para_programa(programa)
    
    print("\n" + "=" * 60)
    print("🎯 TODOS LOS PLAYLISTS GENERADOS")
    print("=" * 60)
    print("📍 Ubicación: music/<programa>/playlist.json")
    print("📁 Programas procesados:", ", ".join(PROGRAMS))
    print("\n⚠️  EJECUTA: python playlist_generator.py")
    print("=" * 60)

if __name__ == "__main__":
    main()
