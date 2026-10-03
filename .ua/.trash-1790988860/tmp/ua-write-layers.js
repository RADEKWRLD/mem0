const fs = require("fs");

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("usage: node ua-write-layers.js <arch-input.json> <layers.json>");
  process.exit(1);
}

const { fileNodes } = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const definitions = [
  {
    id: "layer:api-boundary",
    name: "SDK 入口与 API 边界层",
    description: "暴露 Python SDK 公共入口、托管平台同步/异步 HTTP client 与 OpenAI 兼容代理，并统一对外异常边界。",
    matches: (node) =>
      node.filePath === "mem0/__init__.py" ||
      node.filePath === "mem0/exceptions.py" ||
      node.filePath.startsWith("mem0/client/") ||
      node.filePath.startsWith("mem0/proxy/"),
  },
  {
    id: "layer:memory-core",
    name: "核心记忆编排层",
    description: "以 Memory 与 AsyncMemory 为中心编排事实抽取、检索、更新、图关系、历史记录、遥测和本地运行状态。",
    matches: (node) =>
      node.filePath.startsWith("mem0/memory/") ||
      [
        "mem0/configs/__init__.py",
        "mem0/configs/base.py",
        "mem0/configs/enums.py",
        "mem0/configs/prompts.py",
      ].includes(node.filePath),
  },
  {
    id: "layer:llm-adapters",
    name: "LLM 适配层",
    description: "通过统一抽象与 Pydantic 配置封装 OpenAI、Anthropic、Bedrock、Gemini 等 LLM provider 的请求、工具调用和响应差异。",
    matches: (node) =>
      node.filePath.startsWith("mem0/llms/") || node.filePath.startsWith("mem0/configs/llms/"),
  },
  {
    id: "layer:embedding-adapters",
    name: "Embedding 适配层",
    description: "把云端与本地 embedding provider 统一成单条及批量向量化契约，并集中处理模型、维度、认证和任务类型配置。",
    matches: (node) =>
      node.filePath.startsWith("mem0/embeddings/") || node.filePath.startsWith("mem0/configs/embeddings/"),
  },
  {
    id: "layer:vector-persistence",
    name: "向量持久化适配层",
    description: "定义向量存储 CRUD 与检索契约，并将其映射到 PGVector、Qdrant、Pinecone、Milvus、Redis 等多种后端及强类型配置。",
    matches: (node) =>
      node.filePath.startsWith("mem0/vector_stores/") || node.filePath.startsWith("mem0/configs/vector_stores/"),
  },
  {
    id: "layer:reranking",
    name: "重排层",
    description: "以统一 reranker 接口对检索候选进行相关性评分、排序与 top-k 截断，并适配 Cohere、Hugging Face、LLM 等实现。",
    matches: (node) =>
      node.filePath.startsWith("mem0/reranker/") || node.filePath.startsWith("mem0/configs/rerankers/"),
  },
  {
    id: "layer:shared-utility",
    name: "共享能力与工厂层",
    description: "提供 provider 延迟装配工厂、HTTP/GCP 认证、实体抽取、词形还原、spaCy 模型管理和混合检索评分等横切能力。",
    matches: (node) => node.filePath.startsWith("mem0/utils/"),
  },
  {
    id: "layer:documentation",
    name: "文档与贡献指南层",
    description: "说明项目定位、安装与 API 用法，以及安全、社区治理、贡献门槛和 Python SDK 开发约定。",
    matches: (node) => node.type === "document",
  },
  {
    id: "layer:project-tooling",
    name: "工程配置与开发流水线层",
    description: "管理 Python 包构建、依赖与测试矩阵、pre-commit 检查、benchmark submodule、插件市场元数据和 Makefile 开发任务。",
    matches: (node) => !node.filePath.includes("/") && node.type !== "document",
  },
];

const assigned = new Map();
const layers = definitions.map(({ matches, ...layer }) => ({ ...layer, nodeIds: [] }));
for (const node of fileNodes) {
  const matches = definitions
    .map((definition, index) => ({ definition, index }))
    .filter(({ definition }) => definition.matches(node));
  if (matches.length !== 1) {
    console.error(`${node.id} matched ${matches.length} layers`);
    process.exit(1);
  }
  const layer = layers[matches[0].index];
  if (assigned.has(node.id)) {
    console.error(`duplicate assignment: ${node.id}`);
    process.exit(1);
  }
  layer.nodeIds.push(node.id);
  assigned.set(node.id, layer.id);
}

if (layers.length < 3 || layers.length > 10 || layers.some((layer) => layer.nodeIds.length === 0)) {
  console.error("invalid layer count or empty layer");
  process.exit(1);
}
if (assigned.size !== fileNodes.length) {
  console.error(`assigned ${assigned.size} of ${fileNodes.length} nodes`);
  process.exit(1);
}

fs.writeFileSync(outputPath, JSON.stringify(layers, null, 2) + "\n");
