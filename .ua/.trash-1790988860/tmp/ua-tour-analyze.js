#!/usr/bin/env node

const fs = require("fs");

function fail(error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
}

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    throw new Error("Usage: ua-tour-analyze.js <input.json> <output.json>");
  }

  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const edges = Array.isArray(input.edges) ? input.edges : [];
  const layers = Array.isArray(input.layers) ? input.layers : [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const fanIn = new Map(nodes.map((node) => [node.id, 0]));
  const fanOut = new Map(nodes.map((node) => [node.id, 0]));

  for (const edge of edges) {
    if (fanOut.has(edge.source)) fanOut.set(edge.source, fanOut.get(edge.source) + 1);
    if (fanIn.has(edge.target)) fanIn.set(edge.target, fanIn.get(edge.target) + 1);
  }

  const ranking = (counts, key) => [...counts.entries()]
    .map(([id, count]) => ({ id, [key]: count, name: nodeById.get(id)?.name || id }))
    .sort((a, b) => b[key] - a[key] || a.id.localeCompare(b.id))
    .slice(0, 20);
  const fanInRanking = ranking(fanIn, "fanIn");
  const fanOutRanking = ranking(fanOut, "fanOut");

  const codeNodes = nodes.filter((node) => node.type === "file");
  const sortedFanOut = codeNodes.map((node) => fanOut.get(node.id) || 0).sort((a, b) => a - b);
  const sortedFanIn = codeNodes.map((node) => fanIn.get(node.id) || 0).sort((a, b) => a - b);
  const topOutThreshold = sortedFanOut[Math.max(0, Math.floor(sortedFanOut.length * 0.9))] || 0;
  const lowInThreshold = sortedFanIn[Math.max(0, Math.floor(sortedFanIn.length * 0.25))] || 0;
  const entryNames = new Set([
    "index.ts", "index.js", "main.ts", "main.js", "app.ts", "app.js", "server.ts", "server.js",
    "mod.rs", "main.go", "main.py", "main.rs", "manage.py", "app.py", "wsgi.py", "asgi.py", "run.py",
    "__main__.py", "Application.java", "Main.java", "Program.cs", "config.ru", "index.php", "App.swift",
    "Application.kt", "main.cpp", "main.c",
  ]);
  const entryPointCandidates = nodes.map((node) => {
    let score = 0;
    const path = node.filePath || node.name || "";
    const depth = path.split("/").length;
    if (node.type === "file") {
      if (entryNames.has(node.name)) score += 3;
      if (depth <= 2) score += 1;
      if ((fanOut.get(node.id) || 0) >= topOutThreshold) score += 1;
      if ((fanIn.get(node.id) || 0) <= lowInThreshold) score += 1;
    } else if (node.type === "document") {
      if (path === "README.md") score += 5;
      else if (depth === 1 && path.endsWith(".md")) score += 2;
    }
    return { id: node.id, score, name: node.name, summary: node.summary || "" };
  }).filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 5);

  const start = entryPointCandidates.find((candidate) => nodeById.get(candidate.id)?.type === "file");
  const adjacency = new Map();
  for (const edge of edges) {
    if (!["imports", "calls"].includes(edge.type) || !nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge.target);
  }
  for (const targets of adjacency.values()) targets.sort();
  const order = [];
  const depthMap = {};
  if (start) {
    const queue = [start.id];
    depthMap[start.id] = 0;
    while (queue.length) {
      const current = queue.shift();
      order.push(current);
      for (const target of adjacency.get(current) || []) {
        if (depthMap[target] !== undefined) continue;
        depthMap[target] = depthMap[current] + 1;
        queue.push(target);
      }
    }
  }
  const byDepth = {};
  for (const id of order) {
    const depth = String(depthMap[id]);
    if (!byDepth[depth]) byDepth[depth] = [];
    byDepth[depth].push(id);
  }

  const inventory = (acceptedTypes) => nodes.filter((node) => acceptedTypes.includes(node.type)).map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    summary: node.summary || "",
  }));
  const nonCodeFiles = {
    documentation: inventory(["document"]),
    infrastructure: inventory(["service", "pipeline", "resource"]),
    data: inventory(["table", "schema", "endpoint"]),
    config: inventory(["config"]),
  };

  const relationshipTypes = new Set(["imports", "calls"]);
  const directed = new Set(edges.filter((edge) => relationshipTypes.has(edge.type)).map((edge) => `${edge.source}\u0000${edge.target}\u0000${edge.type}`));
  const pairs = [];
  const seenPairs = new Set();
  for (const edge of edges) {
    if (!relationshipTypes.has(edge.type) || !nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    if (edge.source === edge.target) continue;
    if (!directed.has(`${edge.target}\u0000${edge.source}\u0000${edge.type}`)) continue;
    const pair = [edge.source, edge.target].sort();
    const key = pair.join("\u0000");
    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      pairs.push(new Set(pair));
    }
  }
  const undirectedNeighbors = new Map();
  for (const edge of edges) {
    if (!relationshipTypes.has(edge.type) || !nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    if (!undirectedNeighbors.has(edge.source)) undirectedNeighbors.set(edge.source, new Set());
    if (!undirectedNeighbors.has(edge.target)) undirectedNeighbors.set(edge.target, new Set());
    undirectedNeighbors.get(edge.source).add(edge.target);
    undirectedNeighbors.get(edge.target).add(edge.source);
  }
  for (const cluster of pairs) {
    let changed = true;
    while (changed && cluster.size < 5) {
      changed = false;
      const candidates = [...nodeById.keys()].filter((id) => !cluster.has(id)).map((id) => ({
        id,
        links: [...(undirectedNeighbors.get(id) || [])].filter((neighbor) => cluster.has(neighbor)).length,
      })).filter((candidate) => candidate.links >= 2).sort((a, b) => b.links - a.links || a.id.localeCompare(b.id));
      if (candidates.length) {
        cluster.add(candidates[0].id);
        changed = true;
      }
    }
  }
  const clusters = pairs.map((cluster) => {
    const clusterNodes = [...cluster].sort();
    const set = new Set(clusterNodes);
    const edgeCount = edges.filter((edge) => relationshipTypes.has(edge.type) && set.has(edge.source) && set.has(edge.target)).length;
    return { nodes: clusterNodes, edgeCount };
  }).sort((a, b) => b.edgeCount - a.edgeCount || b.nodes.length - a.nodes.length).slice(0, 10);

  const nodeSummaryIndex = Object.fromEntries(nodes.map((node) => [node.id, {
    name: node.name,
    type: node.type,
    summary: node.summary || "",
  }]));

  const results = {
    scriptCompleted: true,
    entryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal: { startNode: start?.id || null, order, depthMap, byDepth },
    nonCodeFiles,
    clusters,
    layers: { count: layers.length, list: layers.map(({ id, name, description }) => ({ id, name, description })) },
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  fail(error);
}
