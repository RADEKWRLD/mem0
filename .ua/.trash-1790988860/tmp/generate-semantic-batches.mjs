import fs from "node:fs";
import path from "node:path";

const root = "/Users/cenghaoyang/mem0";
const ua = path.join(root, ".ua");
const batchesDoc = JSON.parse(fs.readFileSync(path.join(ua, "intermediate/batches.json"), "utf8"));

function complexity(lines) {
  if (lines > 200) return "complex";
  if (lines >= 50) return "moderate";
  return "simple";
}

function providerLabel(filePath) {
  const base = path.basename(filePath, ".py");
  const labels = {
    azure_ai_search: "Azure AI Search",
    azure_mysql: "Azure MySQL",
    baidu: "Baidu VectorDB",
    cassandra: "Cassandra",
    chroma: "Chroma",
    databricks: "Databricks Vector Search",
    elasticsearch: "Elasticsearch",
    faiss: "FAISS",
    langchain: "LangChain",
    milvus: "Milvus",
    mongodb: "MongoDB Atlas Vector Search",
    neptune_analytics: "Neptune Analytics",
    opensearch: "OpenSearch",
    oracledb: "Oracle AI Vector Search",
    pgvector: "PGVector",
    pinecone: "Pinecone",
    qdrant: "Qdrant",
    redis: "Redis",
    s3_vectors: "Amazon S3 Vectors",
    supabase: "Supabase",
    turbopuffer: "Turbopuffer",
    upstash_vector: "Upstash Vector",
    valkey: "Valkey",
    vertex_ai_vector_search: "Vertex AI Vector Search",
    weaviate: "Weaviate",
    anthropic: "Anthropic",
    aws_bedrock: "AWS Bedrock",
    azure_openai: "Azure OpenAI",
    azure_openai_structured: "Azure OpenAI Structured Outputs",
    deepseek: "DeepSeek",
    gemini: "Gemini",
    groq: "Groq",
    litellm: "LiteLLM",
    lmstudio: "LM Studio",
    minimax: "MiniMax",
    ollama: "Ollama",
    openai: "OpenAI",
    openai_structured: "OpenAI Structured Outputs",
    sarvam: "Sarvam",
    together: "Together AI",
    vllm: "vLLM",
    xai: "xAI",
  };
  return labels[base] ?? base.replaceAll("_", " ");
}

function fileSummary(filePath) {
  const provider = providerLabel(filePath);
  if (filePath === "mem0/vector_stores/base.py") return "定义向量存储后端必须实现的统一抽象契约，覆盖集合管理、向量检索、CRUD、批量与关键词搜索能力。";
  if (filePath.startsWith("mem0/configs/vector_stores/")) return `定义 ${provider} 向量存储适配器的 Pydantic 配置模型、索引参数及连接约束。`;
  if (filePath.startsWith("mem0/vector_stores/")) return `实现 ${provider} 向量存储适配器，将 Mem0 的统一集合、写入、检索、过滤和生命周期接口映射到该后端。`;
  if (filePath === "mem0/configs/llms/base.py") return "定义所有 LLM provider 配置共享的基础字段与参数校验规则。";
  if (filePath.startsWith("mem0/configs/llms/")) return `定义 ${provider} LLM 适配器的模型参数、凭证、端点及 provider 特有校验规则。`;
  if (filePath === "mem0/llms/base.py") return "定义 LLM 适配器抽象基类，集中处理通用生成参数、推理模型差异与响应生成契约。";
  if (filePath.startsWith("mem0/llms/")) return `实现 ${provider} LLM 适配器，负责消息与工具格式转换、请求参数组装以及响应规范化。`;
  const summaries = {
    "mem0/memory/utils.py": "提供记忆事实抽取、消息规范化、视觉消息处理、JSON 清洗与图关系消毒等共享工具。",
    "mem0/__init__.py": "暴露 Mem0 Python SDK 的顶层版本信息和主要公共入口。",
    "mem0/client/main.py": "实现托管 Mem0 平台的同步与异步 HTTP 客户端，覆盖记忆 CRUD、搜索、项目、画像、导出、Webhook 与反馈 API。",
    "mem0/client/project.py": "封装组织与项目管理 API，并为同步和异步客户端提供共享参数校验与成员管理操作。",
    "mem0/client/types.py": "定义托管客户端各类操作的 Pydantic 请求选项模型，统一可选参数与序列化边界。",
    "mem0/client/utils.py": "集中处理托管 API 的 HTTP/请求异常，将底层错误转换为稳定的 SDK APIError。",
    "mem0/configs/enums.py": "定义记忆类型等核心枚举，供存储与业务流程统一判别。",
    "mem0/configs/prompts.py": "集中维护记忆抽取、更新、删除、摘要与时间解析提示词，并提供动态上下文拼装函数。",
    "mem0/exceptions.py": "定义 SDK 的分层异常体系，并把 HTTP 状态码与服务端错误响应映射为可诊断的领域异常。",
    "mem0/memory/__init__.py": "标记 memory 子包并作为核心记忆实现的包级入口。",
    "mem0/memory/base.py": "定义记忆系统的抽象 CRUD 与历史查询契约。",
    "mem0/memory/main.py": "实现开源同步与异步记忆引擎，编排 LLM 抽取、embedding、向量检索、图关系、重排、历史记录与实体索引。",
    "mem0/memory/notices.py": "实现 OSS 功能提示与容量机会检测，通过本地状态、远端配置和采样规则控制首次运行、时间、衰减、规模及性能提示。",
    "mem0/memory/setup.py": "管理本地匿名用户标识、配置文件初始化和身份别名标记，为遥测与客户端迁移提供持久状态。",
    "mem0/memory/storage.py": "以 SQLite 持久化记忆变更历史和对话消息，并负责旧表结构迁移与批量写入。",
    "mem0/memory/telemetry.py": "封装匿名 OSS/托管客户端遥测，处理采样、事件上报、身份识别与进程退出清理。",
    "mem0/proxy/main.py": "提供 OpenAI 风格 chat.completions 代理，在生成前注入相关长期记忆，并在生成后异步回写对话。",
    "mem0/utils/entity_extraction.py": "从自然语言中融合 NER、技术标识符、专名、引号短语与主题短语候选，清洗去重后产出稳定实体。",
    "mem0/utils/lemmatization.py": "为 BM25 检索提供基于 spaCy 的词形还原与规范化文本处理。",
    "mem0/utils/scoring.py": "组合语义相似度、BM25 与图实体信号，对候选记忆归一化并加权排序。",
  };
  return summaries[filePath] ?? `实现 ${path.basename(filePath)} 对应的核心 SDK 能力。`;
}

function fileTags(filePath) {
  if (filePath.startsWith("mem0/configs/vector_stores/")) return ["configuration", "vector-store", "validation"];
  if (filePath.startsWith("mem0/vector_stores/")) return filePath.endsWith("base.py") ? ["abstract-base", "vector-store", "interface"] : ["vector-store", "adapter", "persistence"];
  if (filePath.startsWith("mem0/configs/llms/")) return ["configuration", "llm", "validation"];
  if (filePath.startsWith("mem0/llms/")) return filePath.endsWith("base.py") ? ["abstract-base", "llm", "interface"] : ["llm", "adapter", "generation"];
  if (filePath.includes("client/")) return ["api-client", "hosted-platform", "http"];
  if (filePath.includes("prompts.py")) return ["prompt-engineering", "memory-extraction", "templates"];
  if (filePath.includes("notices.py")) return ["feature-notice", "local-state", "telemetry"];
  if (filePath.includes("telemetry.py")) return ["telemetry", "sampling", "observability"];
  if (filePath.includes("storage.py")) return ["sqlite", "history", "persistence"];
  if (filePath.includes("entity_extraction.py")) return ["nlp", "entity-extraction", "ranking"];
  if (filePath.includes("scoring.py")) return ["ranking", "bm25", "hybrid-search"];
  if (filePath.includes("proxy/")) return ["openai-compatible", "proxy", "memory-augmentation"];
  if (filePath.includes("exceptions.py")) return ["error-handling", "exception-hierarchy", "api-errors"];
  if (filePath.includes("memory/main.py")) return ["memory-engine", "orchestration", "sync-async"];
  if (filePath.includes("memory/")) return ["memory", "service", "persistence"];
  return ["python-sdk", "entry-point", "public-api"];
}

function classSummary(filePath, name) {
  const provider = providerLabel(filePath);
  if (name === "VectorStoreBase") return "规定所有向量存储实现必须遵守的集合管理、检索和 CRUD 抽象接口。";
  if (name === "LLMBase") return "提供 LLM provider 的公共配置校验、参数能力判定与生成接口基线。";
  if (name === "MemoryBase") return "规定记忆读取、更新、删除和历史查询的抽象接口。";
  if (name === "Memory") return "同步 OSS 记忆引擎，协调抽取、向量/图存储、实体关联、搜索重排与变更历史。";
  if (name === "AsyncMemory") return "异步 OSS 记忆引擎，与同步实现保持能力对称并并发调度外部 provider。";
  if (name === "MemoryClient") return "托管 Mem0 API 的同步客户端，向用户提供完整的记忆与项目管理表面。";
  if (name === "AsyncMemoryClient") return "托管 Mem0 API 的异步客户端，提供可作为异步上下文管理器使用的完整 API 表面。";
  if (name === "BaseProject") return "封装项目 API 的公共身份、参数与成员操作契约。";
  if (name === "Project") return "面向同步 HTTP 客户端的组织、项目及成员管理实现。";
  if (name === "AsyncProject") return "面向异步 HTTP 客户端的组织、项目及成员管理实现。";
  if (name === "SQLiteManager") return "管理本地 SQLite 连接、模式迁移、历史记录与消息持久化。";
  if (name === "AnonymousTelemetry") return "管理匿名遥测客户端生命周期并统一事件和 identify 上报。";
  if (name === "Completions") return "实现带记忆检索注入和异步记忆回写的 OpenAI 兼容 completions 接口。";
  if (name === "StaticFlagResult") return "以静态配置模拟 feature flag 结果，为提示文案和事件属性提供统一读取接口。";
  if (name === "_EntityCandidate") return "表示实体抽取流水线中的候选文本、跨度、来源与优先级。";
  if (name === "OutputData" || name === "MemoryResult") return `规范化 ${provider} 查询结果中的标识、载荷和相似度字段。`;
  if (name === "SafeUnpickler") return "限制可反序列化的全局类型，降低加载 FAISS 本地索引时的 pickle 执行风险。";
  if (name.endsWith("Config") || name.endsWith("Options") || name.endsWith("Params")) return `封装 ${provider} 相关配置字段并执行类型与组合约束校验。`;
  if (name.endsWith("Error") || name === "MemoryError") return `表示 ${name.replace(/Error$/, "")} 失败，并携带统一错误码、上下文和可重试信息。`;
  if (filePath.startsWith("mem0/vector_stores/")) return `将 Mem0 向量存储协议适配到 ${provider}，实现集合、向量、元数据和过滤操作。`;
  if (filePath.startsWith("mem0/llms/")) return `将统一 LLM 生成协议适配到 ${provider}，处理消息、工具调用和响应解析差异。`;
  if (name === "APIError") return "表示托管 HTTP API 返回的结构化错误，保留状态码与响应细节。";
  if (name === "Mem0" || name === "Chat") return "构成 OpenAI 兼容代理的轻量命名空间，并挂载下一级 API 资源。";
  return `实现 ${name} 对应的领域模型或服务能力。`;
}

function classTags(filePath, name) {
  if (name.endsWith("Config") || name.endsWith("Options") || name.endsWith("Params")) return ["data-model", "configuration", "validation"];
  if (name.endsWith("Error") || name === "MemoryError" || name === "APIError") return ["exception", "error-handling", "diagnostics"];
  if (name === "OutputData" || name === "MemoryResult") return ["data-model", "serialization", "search-result"];
  if (name.includes("Memory")) return ["memory-engine", "service", "public-api"];
  if (filePath.startsWith("mem0/vector_stores/")) return ["vector-store", "adapter", "service"];
  if (filePath.startsWith("mem0/llms/")) return ["llm", "adapter", "service"];
  return ["data-model", "service", "python-sdk"];
}

function humanize(name) {
  return name.replace(/^_+/, "").replaceAll("_", " ");
}

function functionSummary(filePath, name) {
  const h = humanize(name);
  const exact = {
    create_exception_from_response: "依据 HTTP 状态码和响应载荷构造最具体的 SDK 领域异常。",
    generate_additive_extraction_prompt: "结合摘要、会话历史和当前消息生成仅追加事实的记忆抽取提示词。",
    get_update_memory_messages: "生成用于判断新增、更新、删除或保持记忆的系统与用户提示消息。",
    extract_json: "从可能带 Markdown 代码块或额外文本的模型输出中提取并解析 JSON。",
    parse_vision_messages: "遍历多模态消息并用视觉模型描述图片，使后续记忆抽取可消费纯文本上下文。",
    sanitize_relationship_for_cypher: "清洗关系名称并生成安全、稳定的 Cypher 关系标识。",
    extract_entities: "从单段文本执行完整实体候选生成、冲突消解与去重流程。",
    extract_entities_batch: "复用 NLP pipeline 批量抽取多段文本的实体。",
    score_and_rank: "融合语义、BM25 与实体增强分数，对记忆候选进行最终排序。",
    lemmatize_for_bm25: "将文本分词并词形还原为适合 BM25 建索引和查询的规范字符串。",
    api_error_handler: "包装同步或异步客户端方法并把 HTTP/网络异常统一转换为 APIError。",
  };
  if (exact[name]) return exact[name];
  if (name.includes("validate") || name.startsWith("_reject")) return `校验并规范化 ${h} 相关输入，在违反约束时尽早抛出明确错误。`;
  if (name.includes("filter")) return `构建或清洗 ${h} 所需的过滤表达式，隔离不同后端的查询语法。`;
  if (name.includes("notice") || name.includes("feature_error")) return `评估并记录 ${h} 的展示条件、容量限制和提示状态。`;
  if (name.includes("telemetry") || name.includes("event")) return `处理 ${h} 的采样、脱敏与事件上报。`;
  if (name.includes("config")) return `读取、组合或持久化 ${h} 所需的配置数据。`;
  if (name.includes("message")) return `转换或组织 ${h}，形成 provider 与记忆流水线可消费的消息结构。`;
  if (name.includes("entity")) return `处理 ${h} 的识别、清洗、持久化或关联逻辑。`;
  if (name.includes("score") || name.includes("bm25")) return `计算并规范化 ${h}，为混合检索排序提供可比较信号。`;
  if (name.includes("json")) return `安全处理 ${h} 的 JSON 表达与数据边界。`;
  if (name.includes("user_id") || name.includes("alias")) return `维护 ${h} 对应的匿名身份与别名持久状态。`;
  return `实现 ${h} 相关的共享业务逻辑，并为上层记忆流程提供稳定结果。`;
}

function functionTags(name) {
  if (name.includes("validate") || name.startsWith("_reject")) return ["validation", "guard", "error-handling"];
  if (name.includes("filter")) return ["query-builder", "filtering", "validation"];
  if (name.includes("prompt") || name.includes("message")) return ["prompt-engineering", "serialization", "utility"];
  if (name.includes("notice")) return ["feature-notice", "state-management", "utility"];
  if (name.includes("telemetry") || name.includes("event")) return ["telemetry", "observability", "utility"];
  if (name.includes("entity")) return ["entity-extraction", "nlp", "utility"];
  if (name.includes("score") || name.includes("bm25")) return ["ranking", "hybrid-search", "utility"];
  return ["utility", "business-logic", "python-sdk"];
}

function parentNodeFor(filePath, className) {
  if (filePath.startsWith("mem0/vector_stores/") && filePath !== "mem0/vector_stores/base.py") {
    const excluded = new Set(["OutputData", "MemoryResult", "SafeUnpickler"]);
    if (!excluded.has(className)) return "class:mem0/vector_stores/base.py:VectorStoreBase";
  }
  if (filePath.startsWith("mem0/configs/llms/") && filePath !== "mem0/configs/llms/base.py") {
    return "class:mem0/configs/llms/base.py:BaseLlmConfig";
  }
  if (filePath.startsWith("mem0/llms/") && filePath !== "mem0/llms/base.py") {
    return "class:mem0/llms/base.py:LLMBase";
  }
  if (filePath === "mem0/client/project.py" && ["Project", "AsyncProject"].includes(className)) return "class:mem0/client/project.py:BaseProject";
  if (filePath === "mem0/memory/main.py" && ["Memory", "AsyncMemory"].includes(className)) return "class:mem0/memory/base.py:MemoryBase";
  if (filePath === "mem0/exceptions.py" && className !== "MemoryError") return "class:mem0/exceptions.py:MemoryError";
  return null;
}

function analyze(batchIndex) {
  const batch = batchesDoc.batches.find((b) => b.batchIndex === batchIndex);
  const extraction = JSON.parse(fs.readFileSync(path.join(ua, `tmp/ua-file-extract-results-${batchIndex}.json`), "utf8"));
  const nodes = [];
  const edges = [];
  for (const result of extraction.results) {
    const fileId = `file:${result.path}`;
    nodes.push({
      id: fileId,
      type: "file",
      name: path.basename(result.path),
      filePath: result.path,
      summary: fileSummary(result.path),
      tags: fileTags(result.path),
      complexity: complexity(result.nonEmptyLines),
    });
    for (const target of batch.batchImportData[result.path] ?? []) {
      edges.push({ source: fileId, target: `file:${target}`, type: "imports", direction: "forward", weight: 0.7 });
    }
    const exported = new Set((result.exports ?? []).map((item) => item.name));
    for (const fn of result.functions ?? []) {
      if (!exported.has(fn.name) && fn.endLine - fn.startLine + 1 < 10) continue;
      const id = `function:${result.path}:${fn.name}`;
      nodes.push({
        id,
        type: "function",
        name: fn.name,
        filePath: result.path,
        lineRange: [fn.startLine, fn.endLine],
        summary: functionSummary(result.path, fn.name),
        tags: functionTags(fn.name),
        complexity: complexity(fn.endLine - fn.startLine + 1),
      });
      edges.push({ source: fileId, target: id, type: "contains", direction: "forward", weight: 1.0 });
      if (exported.has(fn.name)) edges.push({ source: fileId, target: id, type: "exports", direction: "forward", weight: 0.8 });
    }
    for (const cls of result.classes ?? []) {
      if (!exported.has(cls.name) && (cls.methods ?? []).length < 2 && cls.endLine - cls.startLine + 1 < 20) continue;
      const id = `class:${result.path}:${cls.name}`;
      nodes.push({
        id,
        type: "class",
        name: cls.name,
        filePath: result.path,
        lineRange: [cls.startLine, cls.endLine],
        summary: classSummary(result.path, cls.name),
        tags: classTags(result.path, cls.name),
        complexity: complexity(cls.endLine - cls.startLine + 1),
      });
      edges.push({ source: fileId, target: id, type: "contains", direction: "forward", weight: 1.0 });
      if (exported.has(cls.name)) edges.push({ source: fileId, target: id, type: "exports", direction: "forward", weight: 0.8 });
      const parent = parentNodeFor(result.path, cls.name);
      if (parent) edges.push({ source: id, target: parent, type: "inherits", direction: "forward", weight: 0.9 });
    }
  }

  const parts = Math.ceil(Math.max(nodes.length / 60, edges.length / 120));
  const sortedFiles = [...batch.files].map((f) => f.path).sort();
  const chunkSize = Math.ceil(sortedFiles.length / parts);
  const written = [];
  for (let i = 0; i < parts; i += 1) {
    const fileSet = new Set(sortedFiles.slice(i * chunkSize, (i + 1) * chunkSize));
    if (fileSet.size === 0) continue;
    const partNodes = nodes.filter((n) => fileSet.has(n.filePath));
    const nodeIds = new Set(partNodes.map((n) => n.id));
    const partEdges = edges.filter((e) => nodeIds.has(e.source));
    const out = { nodes: partNodes, edges: partEdges };
    const filename = parts === 1 ? `batch-${batchIndex}.json` : `batch-${batchIndex}-part-${i + 1}.json`;
    fs.writeFileSync(path.join(ua, "intermediate", filename), `${JSON.stringify(out, null, 2)}\n`);
    written.push({ filename, nodes: partNodes.length, edges: partEdges.length });
  }
  return { batchIndex, totalNodes: nodes.length, totalEdges: edges.length, importEdges: edges.filter((e) => e.type === "imports").length, expectedImports: Object.values(batch.batchImportData).reduce((n, xs) => n + xs.length, 0), written, skipped: extraction.filesSkipped };
}

const requested = Number(process.argv[2]);
if (![1, 2, 3].includes(requested)) throw new Error("Expected batch index 1, 2, or 3");
console.log(JSON.stringify(analyze(requested)));
