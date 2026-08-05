import osmium
import networkx as nx
import math
import json
import sys

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
        self.station_nodes = {} # id -> {ref, name}
        self.ways = []
        self.node_degrees = {}

    def node(self, n):
        self.node_locations[n.id] = (n.location.lon, n.location.lat)
        if 'railway' in n.tags and n.tags['railway'] in ('station', 'halt', 'stop'):
            ref = n.tags.get('ref', '')
            name = n.tags.get('name', '')
            self.station_nodes[n.id] = {'ref': ref, 'name': name}

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

print("Simplifying graph...")
# Remove non-station nodes of degree 2
nodes_to_remove = []
for n in list(G.nodes()):
    if G.degree(n) == 2 and n not in handler.station_nodes:
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
        if n in handler.station_nodes:
            if handler.station_nodes[n]['ref']:
                node_data['ref'] = handler.station_nodes[n]['ref']
            if handler.station_nodes[n]['name']:
                node_data['name'] = handler.station_nodes[n]['name']
            node_data['is_station'] = True
        export_data['nodes'][str(n)] = node_data

for u, v, data in G.edges(data=True):
    export_data['edges'].append([str(u), str(v), round(data['weight'], 2)])

with open('data/railway_graph.json', 'w') as f:
    json.dump(export_data, f)
print("Done! Saved to data/railway_graph.json")
