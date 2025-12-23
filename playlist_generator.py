#!/usr/bin/env python3
"""
GENERADOR AUTOMÁTICO de playlist ÚNICO para Teletext Radio
- Calcula duraciones REALES de todos los MP3
- Genera playlist.json principal con orden aleatorio FIJO
"""

import os
import json
import random
from pathlib import Path

# Configuración
BASE_DIR = Path(".")
MUSIC_DIR = BASE_DIR / "music"
SEMILLA_FIJA = 42  # Para que el orden aleatorio sea siempre el mismo

def obtener_duracion_real(mp3_path):
    """Obtiene duración real del MP3 usando mutagen"""
    try:
        # Si no tienes mutagen: pip install mutagen
        from mutagen.mp3 import MP3
        audio = MP3(mp3_path)
        return int(audio.info.length)  # segundos
    except ImportError:
        print("⚠️  Instala mutagen: pip install mutagen")
        # Estimación aproximada (5 min por defecto)
        return 300
    except Exception:
        # Si falla, estimar basado en tamaño (≈ 1MB/min)
        size_mb = mp3_path.stat().st_size / (1024 * 1024)
        return int(size_mb * 60) if size_mb > 0 else 300

def main():
    print("=" * 60)
    print("GENERADOR DE PLAYLIST ÚNICO - Teletext Radio")
    print("=" * 60)
    
    # Buscar TODOS los MP3 en music/
    archivos_mp3 = []
    for ext in ['*.mp3', '*.MP3']:
        archivos_mp3.extend(MUSIC_DIR.glob(ext))
    
    if not archivos_mp3:
        print("❌ No hay archivos MP3 en music/")
        return
    
    print(f"📁 Encontrados {len(archivos_mp3)} archivos MP3")
    
    # Crear lista con duraciones reales
    tracks = []
    duracion_total = 0
    
    for mp3 in archivos_mp3:
        duracion = obtener_duracion_real(mp3)
        tracks.append({
            "file": mp3.name,
            "duration": duracion,
            "path": f"music/{mp3.name}"
        })
        duracion_total += duracion
    
    # Orden aleatorio FIJO (misma semilla siempre)
    random.seed(SEMILLA_FIJA)
    random.shuffle(tracks)
    
    # Crear estructura final
    playlist_data = {
        "version": "1.0",
        "seed": SEMILLA_FIJA,  # Para regenerar el mismo orden
        "total_duration": duracion_total,
        "total_tracks": len(tracks),
        "tracks": tracks
    }
    
    # Guardar playlist.json principal
    output_path = BASE_DIR / "playlist.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(playlist_data, f, indent=2, ensure_ascii=False)
    
    # Mostrar resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN GENERADO:")
    print("=" * 60)
    print(f"📍 Archivo: {output_path}")
    print(f"🎵 Canciones: {len(tracks)}")
    print(f"⏱️  Duración total: {duracion_total} segundos")
    print(f"   ({duracion_total/3600:.2f} horas)")
    print(f"🔀 Orden aleatorio fijo (semilla: {SEMILLA_FIJA})")
    print("\n📋 PRIMERAS 10 CANCIONES:")
    for i, track in enumerate(tracks[:10]):
        mins = track['duration'] // 60
        segs = track['duration'] % 60
        print(f"  {i+1:2d}. {track['file']} ({mins}:{segs:02d})")
    
    if len(tracks) > 10:
        print(f"  ... y {len(tracks)-10} más")
    
    print("=" * 60)

if __name__ == "__main__":
    main()