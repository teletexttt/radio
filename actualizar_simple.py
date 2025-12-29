#!/usr/bin/env python3
import json
from pathlib import Path

MUSIC_DIR = Path("music")
PLAYLIST_FILE = Path("playlist.json")

def main():
    # Buscar todos los MP3 en /music/
    mp3_files = []
    for ext in ['*.mp3', '*.MP3', '*.m4a', '*.M4A']:
        mp3_files.extend(MUSIC_DIR.glob(ext))
    
    # Ordenar por nombre
    mp3_files.sort(key=lambda x: x.name.lower())
    
    # Crear lista SIMPLE de strings (como tu playlist.json actual)
    tracks = [f"music/{mp3.name}" for mp3 in mp3_files]
    
    # Crear JSON exactamente como lo necesitas
    playlist_data = {
        "tracks": tracks
    }
    
    # Guardar
    with open(PLAYLIST_FILE, 'w', encoding='utf-8') as f:
        json.dump(playlist_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {len(tracks)} canciones en playlist.json")
    print("📋 Primeras 5:", tracks[:5])

if __name__ == "__main__":
    main()
