#!/bin/bash
# update_playlist.sh - Actualiza playlist.json localmente

echo "🎵 Actualizando playlist.json..."

# Contar archivos antes
COUNT_BEFORE=$(grep -c '"tracks"' playlist.json 2>/dev/null || echo "0")

# Generar nuevo playlist.json
echo '{ "tracks": [' > playlist.json
find music -type f -name "*.mp3" -printf '  "%P"\n' | sort | sed '$!s/$/,/' >> playlist.json
echo '] }' >> playlist.json

# Contar archivos después
COUNT_MP3=$(find music -type f -name "*.mp3" | wc -l)
COUNT_JSON=$(grep -c '\.mp3' playlist.json)

echo "✅ playlist.json actualizado"
echo "📊 Estadísticas:"
echo "   - Archivos MP3 en music/: $COUNT_MP3"
echo "   - Entradas en playlist.json: $COUNT_JSON"
echo "   - Archivo .keep: $(find music -name ".keep" | wc -l)"

# Verificar coincidencia
if [ "$COUNT_MP3" -eq "$COUNT_JSON" ]; then
    echo "✅ ¡Todo coincide correctamente!"
else
    echo "⚠️  Advertencia: Los números no coinciden"
    echo "   Revisa que no haya archivos ocultos o con extensiones diferentes"
fi
