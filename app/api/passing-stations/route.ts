import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let graphCache: any = null;

function loadGraph() {
  if (!graphCache) {
    const filePath = path.join(process.cwd(), 'data', 'railway_graph.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      graphCache = JSON.parse(raw);
    }
  }
  return graphCache;
}

// Simple Priority Queue for Dijkstra
class PriorityQueue {
  private values: { val: string; priority: number }[] = [];
  
  enqueue(val: string, priority: number) {
    this.values.push({ val, priority });
    this.sort();
  }
  
  dequeue() {
    return this.values.shift();
  }
  
  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }
  
  isEmpty() {
    return this.values.length === 0;
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function findShortestPath(graphData: any, fromLat: number, fromLng: number, toLat: number, toLng: number) {
  // 1. Find closest nodes
  let fromId = '';
  let toId = '';
  let fromDist = Infinity;
  let toDist = Infinity;

  for (const [nodeId, data] of Object.entries(graphData.nodes) as any) {
    if (!data.is_station) continue; // Must start and end at a station
    const distF = haversine(fromLat, fromLng, data.lat, data.lon);
    const distT = haversine(toLat, toLng, data.lat, data.lon);
    if (distF < fromDist) { fromDist = distF; fromId = nodeId; }
    if (distT < toDist) { toDist = distT; toId = nodeId; }
  }

  if (!fromId || !toId || fromDist > 50 || toDist > 50) {
    return null; // Nodes too far or not found
  }

  // 2. Build adjacency list optimized for Dijkstra
  const adjacencyList: Record<string, { node: string; weight: number }[]> = {};
  for (const edge of graphData.edges) {
    const [u, v, w] = edge;
    if (!adjacencyList[u]) adjacencyList[u] = [];
    if (!adjacencyList[v]) adjacencyList[v] = [];
    adjacencyList[u].push({ node: v, weight: w });
    adjacencyList[v].push({ node: u, weight: w });
  }

  // 3. Dijkstra's Algorithm
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const pq = new PriorityQueue();
  
  for (const nodeId of Object.keys(adjacencyList)) {
    if (nodeId === fromId) {
      distances[nodeId] = 0;
      pq.enqueue(nodeId, 0);
    } else {
      distances[nodeId] = Infinity;
    }
    previous[nodeId] = null;
  }

  while (!pq.isEmpty()) {
    const current = pq.dequeue()?.val;
    if (!current) continue;
    
    if (current === toId) {
      // Path found!
      const path = [];
      let curr: string | null = toId;
      while (curr) {
        path.push(curr);
        curr = previous[curr];
      }
      
      // Reverse path and map back to station data
      const finalPath = path.reverse().map(id => ({
        id,
        ...graphData.nodes[id]
      }));
      return finalPath;
    }

    if (current || distances[current] !== Infinity) {
      for (const neighbor of adjacencyList[current] || []) {
        const candidate = distances[current] + neighbor.weight;
        if (candidate < distances[neighbor.node]) {
          distances[neighbor.node] = candidate;
          previous[neighbor.node] = current;
          pq.enqueue(neighbor.node, candidate);
        }
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromLat = parseFloat(searchParams.get('fromLat') || '');
  const fromLng = parseFloat(searchParams.get('fromLng') || '');
  const toLat = parseFloat(searchParams.get('toLat') || '');
  const toLng = parseFloat(searchParams.get('toLng') || '');

  if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
    return NextResponse.json({ error: 'fromLat, fromLng, toLat, toLng are required' }, { status: 400 });
  }

  const graph = loadGraph();
  if (!graph) {
    return NextResponse.json({ error: 'Graph data not available' }, { status: 500 });
  }

  const path = findShortestPath(graph, fromLat, fromLng, toLat, toLng);

  if (!path) {
    return NextResponse.json({ success: false, error: 'Path not found' });
  }

  // Filter the path to only show actual stations (not intermediate raw nodes)
  const stationsOnly = path.filter(n => n.is_station && n.name);

  return NextResponse.json({ success: true, path: stationsOnly });
}
