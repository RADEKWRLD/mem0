const fs = require("fs");
const path = require("path");

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("usage: node ua-arch-analyze.js <input.json> <output.json>");
  process.exit(1);
}

try {
  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const nodes = input.fileNodes || [];
  const imports = input.importEdges || [];
  const allEdges = input.allEdges || [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const paths = nodes.map((node) => node.filePath).filter(Boolean);

  function commonDirectoryPrefix(filePaths) {
    if (!filePaths.length) return [];
    const dirs = filePaths.map((filePath) => filePath.split("/").slice(0, -1));
    const prefix = [];
    for (let i = 0; i < Math.min(...dirs.map((parts) => parts.length)); i += 1) {
      if (dirs.every((parts) => parts[i] === dirs[0][i])) prefix.push(dirs[0][i]);
      else break;
    }
    return prefix;
  }

  const commonPrefix = commonDirectoryPrefix(paths);
  function directoryGroup(node) {
    const parts = node.filePath.split("/");
    const remaining = parts.slice(commonPrefix.length);
    if (remaining.length <= 1) return "root";
    return remaining[0];
  }
  function packageSubgroup(node) {
    const parts = node.filePath.split("/");
    if (parts[0] === "mem0") return parts.length > 2 ? `mem0/${parts[1]}` : "mem0/root";
    return "root";
  }

  const directoryGroups = {};
  const packageSubgroups = {};
  const nodeTypeGroups = {};
  for (const node of nodes) {
    const group = directoryGroup(node);
    (directoryGroups[group] ||= []).push(node.id);
    (packageSubgroups[packageSubgroup(node)] ||= []).push(node.id);
    (nodeTypeGroups[node.type] ||= []).push(node.id);
  }

  const fileFanIn = Object.fromEntries(nodes.map((node) => [node.id, 0]));
  const fileFanOut = Object.fromEntries(nodes.map((node) => [node.id, 0]));
  const adjacency = Object.fromEntries(nodes.map((node) => [node.id, []]));
  const interCounts = new Map();
  const groupImportsFrom = {};
  const groupImportedBy = {};
  const groupInternal = Object.fromEntries(Object.keys(directoryGroups).map((group) => [group, 0]));
  const groupTotal = Object.fromEntries(Object.keys(directoryGroups).map((group) => [group, 0]));

  for (const edge of imports) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) continue;
    fileFanOut[edge.source] += 1;
    fileFanIn[edge.target] += 1;
    adjacency[edge.source].push(edge.target);
    const from = directoryGroup(byId.get(edge.source));
    const to = directoryGroup(byId.get(edge.target));
    const key = `${from}\u0000${to}`;
    interCounts.set(key, (interCounts.get(key) || 0) + 1);
    (groupImportsFrom[from] ||= new Set()).add(to);
    (groupImportedBy[to] ||= new Set()).add(from);
    groupTotal[from] += 1;
    if (to !== from) groupTotal[to] += 1;
    else groupInternal[from] += 1;
  }

  const crossCounts = new Map();
  const nonCodeConnections = [];
  for (const edge of allEdges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    const key = `${source.type}\u0000${target.type}\u0000${edge.type}`;
    crossCounts.set(key, (crossCounts.get(key) || 0) + 1);
    if (source.type !== "file" || target.type !== "file") {
      nonCodeConnections.push({ source: edge.source, target: edge.target, type: edge.type });
    }
  }

  const patterns = [
    [/^(routes|api|controllers|endpoints|handlers|serializers|routers|blueprints)$/, "api"],
    [/^(services|core|lib|domain|logic|internal|composables|mailers|jobs|channels|signals)$/, "service"],
    [/^(models|db|data|persistence|repository|entities|entity|migrations|sql|database|schema)$/, "data"],
    [/^(components|views|pages|ui|layouts|screens)$/, "ui"],
    [/^(middleware|plugins|interceptors|guards)$/, "middleware"],
    [/^(utils|helpers|common|shared|tools|pkg|templatetags)$/, "utility"],
    [/^(config|configs|constants|env|settings|management|commands)$/, "config"],
    [/^(__tests__|test|tests|spec|specs)$/, "test"],
    [/^(types|interfaces|schemas|contracts|dtos|dto|request|response)$/, "types"],
    [/^(docs|documentation|wiki)$/, "documentation"],
    [/^(deploy|deployment|infra|infrastructure|k8s|kubernetes|helm|charts|terraform|tf|docker)$/, "infrastructure"],
    [/^(\.github|\.gitlab|\.circleci)$/, "ci-cd"],
    [/^(cmd|bin)$/, "entry"],
  ];
  function matchPattern(group) {
    const leaf = group.split("/").pop();
    return patterns.find(([regex]) => regex.test(leaf))?.[1] || null;
  }
  const patternMatches = Object.fromEntries(
    Object.keys({ ...directoryGroups, ...packageSubgroups }).map((group) => [group, matchPattern(group)]),
  );

  function filePattern(node) {
    const p = node.filePath;
    const name = path.posix.basename(p);
    if (/((^|\/)test_[^/]+\.py$|\.(test|spec)\.)/.test(p)) return "test";
    if (name === "__init__.py") return "entry";
    if (/^(Dockerfile|docker-compose\.)/.test(name) || name === "Makefile" || /\.(tf|tfvars)$/.test(name)) return "infrastructure";
    if (/^\.github\/workflows\//.test(p) || name === ".gitlab-ci.yml" || name === "Jenkinsfile") return "ci-cd";
    if (/\.(md|rst)$/.test(name)) return "documentation";
    if (/\.(sql)$/.test(name)) return "data";
    if (/\.(graphql|gql|proto)$/.test(name)) return "types";
    if (["pyproject.toml", "Cargo.toml", "go.mod", "Gemfile", "pom.xml", "build.gradle", "composer.json"].includes(name)) return "config";
    return null;
  }

  const infraFiles = nodes.filter((node) => ["infrastructure", "ci-cd"].includes(filePattern(node))).map((node) => node.filePath);
  const docs = nodes.filter((node) => node.type === "document" || filePattern(node) === "documentation");
  const documentedGroups = new Set(docs.map(directoryGroup));
  const groupNames = Object.keys(directoryGroups);
  const schemaFiles = nodes.filter((node) => ["schema", "table"].includes(node.type) || filePattern(node) === "data").map((node) => node.filePath);
  const dataModelFiles = nodes.filter((node) => /\/(models?|entities|repository|storage)\//.test(node.filePath) || /\/storage\.py$/.test(node.filePath)).map((node) => node.filePath);
  const apiHandlerFiles = nodes.filter((node) => /(api|routes|controllers|endpoints|proxy|client)/.test(node.filePath)).map((node) => node.filePath);

  const interGroupImports = [...interCounts].map(([key, count]) => {
    const [from, to] = key.split("\u0000");
    return { from, to, count };
  });
  const dependencyDirection = [];
  const pairSeen = new Set();
  for (const item of interGroupImports) {
    if (item.from === item.to) continue;
    const pair = [item.from, item.to].sort();
    const pairKey = pair.join("\u0000");
    if (pairSeen.has(pairKey)) continue;
    pairSeen.add(pairKey);
    const ab = interCounts.get(`${pair[0]}\u0000${pair[1]}`) || 0;
    const ba = interCounts.get(`${pair[1]}\u0000${pair[0]}`) || 0;
    dependencyDirection.push({ dependent: ab >= ba ? pair[0] : pair[1], dependsOn: ab >= ba ? pair[1] : pair[0] });
  }

  const result = {
    scriptCompleted: true,
    commonPathPrefix: commonPrefix.join("/"),
    directoryGroups,
    packageSubgroups,
    nodeTypeGroups,
    adjacency,
    directoryDependencies: Object.fromEntries(groupNames.map((group) => [group, {
      importsFrom: [...(groupImportsFrom[group] || [])],
      importedBy: [...(groupImportedBy[group] || [])],
    }])),
    crossCategoryEdges: [...crossCounts].map(([key, count]) => {
      const [fromType, toType, edgeType] = key.split("\u0000");
      return { fromType, toType, edgeType, count };
    }),
    nonCodeConnections,
    interGroupImports,
    intraGroupDensity: Object.fromEntries(groupNames.map((group) => [group, {
      internalEdges: groupInternal[group],
      totalEdges: groupTotal[group],
      density: groupTotal[group] ? groupInternal[group] / groupTotal[group] : 0,
    }])),
    patternMatches,
    filePatternMatches: Object.fromEntries(nodes.map((node) => [node.id, filePattern(node)]).filter(([, value]) => value)),
    deploymentTopology: {
      hasDockerfile: infraFiles.some((p) => path.posix.basename(p).startsWith("Dockerfile")),
      hasCompose: infraFiles.some((p) => path.posix.basename(p).startsWith("docker-compose.")),
      hasK8s: infraFiles.some((p) => /(^|\/)(k8s|kubernetes|helm|charts)(\/|$)/.test(p)),
      hasTerraform: infraFiles.some((p) => /\.(tf|tfvars)$/.test(p)),
      hasCI: infraFiles.some((p) => /^\.github\/workflows\//.test(p) || /(^|\/)(Jenkinsfile|\.gitlab-ci\.yml)$/.test(p)),
      infraFiles,
    },
    dataPipeline: {
      schemaFiles,
      migrationFiles: nodes.filter((node) => /(^|\/)migrations?\//.test(node.filePath)).map((node) => node.filePath),
      dataModelFiles,
      apiHandlerFiles,
    },
    docCoverage: {
      groupsWithDocs: documentedGroups.size,
      totalGroups: groupNames.length,
      coverageRatio: groupNames.length ? documentedGroups.size / groupNames.length : 0,
      undocumentedGroups: groupNames.filter((group) => !documentedGroups.has(group)),
    },
    dependencyDirection,
    fileStats: {
      totalFileNodes: nodes.length,
      filesPerGroup: Object.fromEntries(Object.entries(directoryGroups).map(([group, ids]) => [group, ids.length])),
      filesPerPackageSubgroup: Object.fromEntries(Object.entries(packageSubgroups).map(([group, ids]) => [group, ids.length])),
      nodeTypeCounts: Object.fromEntries(Object.entries(nodeTypeGroups).map(([type, ids]) => [type, ids.length])),
    },
    fileFanIn,
    fileFanOut,
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
} catch (error) {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
}
