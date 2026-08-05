import osmium
import networkx as nx
import math
import json
import sys
from scipy.spatial import KDTree

def haversine(lon1, lat1, lon2, lat2):
    R = 6371.0 # km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class WayHandler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.node_locations = {} # id -> (lon, lat)
        self.station_nodes = {} # id -> {ref, name, lon, lat}
        self.ways = []
        self.node_degrees = {}

    def node(self, n):
        lon, lat = n.location.lon, n.location.lat
        self.node_locations[n.id] = (lon, lat)
        
        is_station = False
        if 'railway' in n.tags and n.tags['railway'] in ('station', 'halt', 'stop', 'stop_position'):
            is_station = True
        elif 'public_transport' in n.tags and n.tags['public_transport'] in ('station', 'stop_position', 'stop_area'):
            is_station = True
            
        if is_station:
            ref = n.tags.get('ref', '')
            name = n.tags.get('name', '')
            self.station_nodes[n.id] = {'ref': ref, 'name': name, 'lon': lon, 'lat': lat}

    def way(self, w):
        if 'railway' in w.tags and w.tags['railway'] in ('rail', 'narrow_gauge', 'light_rail'):
            nodes = [n.ref for n in w.nodes]
            self.ways.append(nodes)
            for n in nodes:
                self.node_degrees[n] = self.node_degrees.get(n, 0) + 1

print("Parsing OSM file...")
handler = WayHandler()
handler.apply_file('data/railways.osm.pbf', locations=True)

print(f"Nodes loaded: {len(handler.node_locations)}")
print(f"Stations found: {len(handler.station_nodes)}")
print(f"Ways found: {len(handler.ways)}")

print("Building graph...")
G = nx.Graph()

for way_nodes in handler.ways:
    for i in range(len(way_nodes) - 1):
        u = way_nodes[i]
        v = way_nodes[i+1]
        if u in handler.node_locations and v in handler.node_locations:
            lon1, lat1 = handler.node_locations[u]
            lon2, lat2 = handler.node_locations[v]
            dist = haversine(lon1, lat1, lon2, lat2)
            G.add_edge(u, v, weight=dist)

print(f"Initial graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

print("Mapping off-track stations to nearest on-track nodes...")
graph_nodes = list(G.nodes())
graph_coords = [handler.node_locations[n] for n in graph_nodes]
tree = KDTree(graph_coords)

mapped_stations = {} # graph_node_id -> {ref, name}
for st_id, st_data in handler.station_nodes.items():
    if not st_data['name'] and not st_data['ref']:
        continue
    # Find nearest graph node
    dist_degrees, idx = tree.query((st_data['lon'], st_data['lat']))
    nearest_graph_node = graph_nodes[idx]
    
    n_lon, n_lat = handler.node_locations[nearest_graph_node]
    dist_km = haversine(st_data['lon'], st_data['lat'], n_lon, n_lat)
    
    if dist_km < 2.0: # within 2km
        if nearest_graph_node in mapped_stations:
            existing = mapped_stations[nearest_graph_node]
            if not existing['ref'] and st_data['ref']:
                mapped_stations[nearest_graph_node] = st_data
        else:
            mapped_stations[nearest_graph_node] = st_data

print(f"Mapped {len(mapped_stations)} stations to track nodes.")

# Adjust weights to prefer station nodes
for u, v, d in G.edges(data=True):
    if u in mapped_stations or v in mapped_stations:
        d['weight'] = d['weight'] * 0.5 # 50% discount for paths that go through stations!

print("Simplifying graph...")
# Remove non-station nodes of degree 2
nodes_to_remove = []
for n in list(G.nodes()):
    if G.degree(n) == 2 and n not in mapped_stations:
        nodes_to_remove.append(n)

for n in nodes_to_remove:
    neighbors = list(G.neighbors(n))
    if len(neighbors) == 2:
        u, v = neighbors
        weight = G[n][u]['weight'] + G[n][v]['weight']
        G.add_edge(u, v, weight=weight)
        G.remove_node(n)

print(f"Simplified graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

print("Exporting JSON...")
export_data = {
    'nodes': {},
    'edges': []
}

for n in G.nodes():
    if n in handler.node_locations:
        lon, lat = handler.node_locations[n]
        node_data = {'lat': lat, 'lon': lon}
        if n in mapped_stations:
            if mapped_stations[n]['ref']:
                node_data['ref'] = mapped_stations[n]['ref']
            if mapped_stations[n]['name']:
                node_data['name'] = mapped_stations[n]['name']
            node_data['is_station'] = True
        export_data['nodes'][str(n)] = node_data

for u, v, data in G.edges(data=True):
    export_data['edges'].append([str(u), str(v), round(data['weight'], 2)])

with open('data/railway_graph.json', 'w') as f:
    json.dump(export_data, f)
print("Done! Saved to data/railway_graph.json")
