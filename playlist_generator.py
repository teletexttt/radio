#!/usr/bin/env python3
"""
GENERADOR DE PLAYLIST POR CARPETA/PROGRAMA
- Lee music/_programs.json para conocer programas
- Genera playlist.json en CADA carpeta de programa
"""

import os
import json
import random
from pathlib import Path
import mutagen

# Configuración
BASE_DIR = Path(".")
MUSIC_DIR = BASE_DIR / "music"
CONFIG_FILE = MUSIC_DIR / "_programs.json"
SEMILLA_FIJA = 42  # Aleatorio fijo por programa

def obtener_duracion_real(mp3_path):
    """Obtiene duración real en segundos"""
    try:
        audio = mutagen.File(mp3_path)
        if audio is not None:
            return int(audio.info.length)
    except:
        pass
    # Estimación por tamaño (1MB ≈ 1 minuto)
    size_mb = mp3_path.stat().st_size / (1024 * 1024)
    return int(size_mb * 60) if size_mb > 0 else 300

def generar_playlist_para_programa(programa):
    """Genera playlist.json para un programa específico"""
    carpeta = MUSIC_DIR / programa["folder"]
    
    if not carpeta.exists():
        print(f"  ⚠️  Carpeta '{programa['folder']}' no existe, saltando...")
        return
    
    # Buscar MP3s en esta carpeta
    archivos_mp3 = []
    for ext in ['*.mp3', '*.MP3', '*.m4a', '*.M4A']:
        archivos_mp3.extend(carpeta.glob(ext))
    
    if not archivos_mp3:
        print(f"  ❌ No hay archivos de audio en '{programa['folder']}'")
        return
    
    print(f"  📁 {programa['name']}: {len(archivos_mp3)} archivos")
    
    # Crear lista de tracks con rutas RELATIVAS
    tracks = []
    duracion_total = 0
    
    for mp3 in archivos_mp3:
        duracion = obtener_duracion_real(mp3)
        tracks.append({
            "file": mp3.name,
            "duration": duracion,
            "path": f"music/{programa['folder']}/{mp3.name}"  # ← RUTA CORRECTA
        })
        duracion_total += duracion
    
    # Orden aleatorio FIJO por programa
    random.seed(SEMILLA_FIJA + hash(programa["folder"]) % 1000)
    random.shuffle(tracks)
    
    # Datos para el playlist.json
    playlist_data = {
        "program": programa["name"],
        "folder": programa["folder"],
        "schedule": programa["schedule"],
        "seed": SEMILLA_FIJA,
        "total_duration": duracion_total,
        "total_tracks": len(tracks),
        "tracks": tracks
    }
    
    # Guardar EN LA CARPETA del programa
    output_path = carpeta / "playlist.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(playlist_data, f, indent=2, ensure_ascii=False)
    
    print(f"    ✅ Generado: {programa['folder']}/playlist.json")
    print(f"       ⏱️  Duración total: {duracion_total//3600}h {(duracion_total%3600)//60}m")

def main():
    print("=" * 60)
    print("GENERADOR DE PLAYLIST POR PROGRAMA - Teletext Radio")
    print("=" * 60)
    
    # Cargar configuración
    if not CONFIG_FILE.exists():
        print("❌ ERROR: No existe music/_programs.json")
        print("   Crea primero el archivo de configuración")
        return
    
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    print(f"📋 Programas encontrados: {len(config['programs'])}")
    
    # Generar playlist para cada programa
    for programa in config["programs"]:
        print(f"\n🎵 Procesando: {programa['name']}")
        generar_playlist_para_programa(programa)
    
    # Resumen final
    print("\n" + "=" * 60)
    print("✅ GENERACIÓN COMPLETADA")
    print("=" * 60)
    print("\n📊 ESTRUCTURA FINAL:")
    print(f"{MUSIC_DIR}/")
    print("├── _programs.json")
    for programa in config["programs"]:
        carpeta = MUSIC_DIR / programa["folder"]
        playlist = carpeta / "playlist.json"
        if playlist.exists():
            mp3_count = len(list(carpeta.glob("*.mp3"))) + len(list(carpeta.glob("*.MP3")))
            print(f"├── {programa['folder']}/")
            print(f"│   ├── playlist.json ({mp3_count} tracks)")
            print(f"│   └── [archivos .mp3]")

if __name__ == "__main__":
    main()
