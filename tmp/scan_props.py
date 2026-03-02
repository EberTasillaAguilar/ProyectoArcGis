import json
import os

def scan_properties(filepath):
    if not os.path.exists(filepath): return
    print(f"Scanning {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    unique_props = set()
    sample_values = {}
    for feat in data.get('features', []):
        props = feat.get('properties', {})
        for k, v in props.items():
            unique_props.add(k)
            if k not in sample_values: sample_values[k] = v
            
    print(f"Keys: {unique_props}")
    print(f"Samples: {sample_values}")
    
if __name__ == "__main__":
    scan_properties('public/maps/Map3/distritos.json')
    scan_properties('public/maps/Map3/distritos_logisticos_afectados.json')
    scan_properties('public/maps/Map 09/centros_salud_opt.json')
