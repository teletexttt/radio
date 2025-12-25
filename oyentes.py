#!/usr/bin/env python3
"""
SISTEMA DE OYENTES EN VIVO para Teletext Radio
- Registra oyentes activos cada 30 segundos
- Cuenta visitas en tiempo real
"""

from flask import Flask, jsonify, request
import json
import time
from datetime import datetime
from pathlib import Path
import uuid

app = Flask(__name__)
DATA_FILE = Path("oyentes_data.json")

# Datos iniciales
if not DATA_FILE.exists():
    with open(DATA_FILE, 'w') as f:
        json.dump({
            "total_visitas": 0,
            "oyentes_activos": {},
            "historial": []
        }, f)

def leer_datos():
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def guardar_datos(datos):
    with open(DATA_FILE, 'w') as f:
        json.dump(datos, f, indent=2)

@app.route('/oyente/ping', methods=['POST'])
def ping_oyente():
    """Registra/actualiza un oyente activo"""
    datos = leer_datos()
    
    # Generar o usar ID existente
    oyente_id = request.json.get('id')
    if not oyente_id or oyente_id not in datos['oyentes_activos']:
        oyente_id = str(uuid.uuid4())
        datos['total_visitas'] += 1
    
    # Actualizar timestamp
    timestamp = time.time()
    datos['oyentes_activos'][oyente_id] = {
        'ultima_actividad': timestamp,
        'timestamp': datetime.now().isoformat()
    }
    
    # Limpiar inactivos (más de 2 minutos)
    inactivos = []
    for oid, info in datos['oyentes_activos'].items():
        if timestamp - info['ultima_actividad'] > 120:  # 2 minutos
            inactivos.append(oid)
    
    for oid in inactivos:
        datos['oyentes_activos'].pop(oid)
    
    guardar_datos(datos)
    
    return jsonify({
        'id': oyente_id,
        'oyentes_activos': len(datos['oyentes_activos']),
        'total_visitas': datos['total_visitas']
    })

@app.route('/oyente/contador')
def obtener_contador():
    """Obtiene contador de oyentes activos"""
    datos = leer_datos()
    timestamp = time.time()
    
    # Limpiar inactivos antes de contar
    oyentes_activos = datos['oyentes_activos'].copy()
    for oid, info in list(oyentes_activos.items()):
        if timestamp - info['ultima_actividad'] > 120:
            datos['oyentes_activos'].pop(oid)
    
    guardar_datos(datos)
    
    return jsonify({
        'oyentes_activos': len(datos['oyentes_activos']),
        'total_visitas': datos['total_visitas'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/oyente/stats')
def obtener_estadisticas():
    """Estadísticas detalladas"""
    datos = leer_datos()
    return jsonify(datos)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)