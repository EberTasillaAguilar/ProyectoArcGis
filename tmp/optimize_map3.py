import json
import os
import math

def process_coords(coords, precision=4):
    if not coords: return coords
    if isinstance(coords[0], (int, float)):
        return [round(c, precision) for c in coords]
    return [process_coords(c, precision) for c in coords]

def optimize_file(filename):
    path = f'public/maps/Map3/{filename}'
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
        
    print(f"Optimizing {filename}...")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for feature in data.get('features', []):
        if feature.get('geometry'):
            feature['geometry']['coordinates'] = process_coords(feature['geometry']['coordinates'])
            
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)
    
    print(f"Done optimizing {filename}. New size: {os.path.getsize(path)/(1024*1024):.2f} MB")

if __name__ == "__main__":
    optimize_file('distritos.json')
    optimize_file('distritos_logisticos_afectados.json')
    optimize_file('red_rutas_logisticas.json')
