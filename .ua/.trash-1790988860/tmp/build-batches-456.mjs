import fs from "node:fs";
import path from "node:path";

const root = "/Users/cenghaoyang/mem0";
const ua = path.join(root, ".ua");
const batchesDoc = JSON.parse(fs.readFileSync(path.join(ua, "intermediate/batches.json"), "utf8"));

const fileMeta = {
  "mem0/configs/embeddings/base.py": ["汇总所有 embedding provider 的通用配置，包括模型、维度、代理、云端凭据与按记忆动作选择 embedding 类型，是各适配器的统一配置入口。", ["configuration", "embeddings", "provider-config"], "以普通 Python 配置对象统一不同厂商参数，并在初始化阶段构造 HTTP client 与 Azure 子配置。"],
  "mem0/embeddings/aws_bedrock.py": ["实现 AWS Bedrock embedding 适配器，按模型家族组装请求、解析不同响应格式，并可对向量执行归一化。", ["embeddings", "provider-adapter", "aws-bedrock"]],
  "mem0/embeddings/azure_openai.py": ["实现 Azure OpenAI embedding 适配器，支持 API key 或 Azure Identity 认证，并提供单条与分批向量化。", ["embeddings", "provider-adapter", "azure-openai"]],
  "mem0/embeddings/base.py": ["定义 embedding provider 的抽象契约和默认批处理行为，使上层 Memory 流程可以统一调用不同向量模型。", ["embeddings", "abstract-base", "interface"], "通过 ABC 与抽象 embed 方法建立 provider 插件边界，embed_batch 默认逐条回退。"],
  "mem0/embeddings/fastembed.py": ["将 FastEmbed 的本地 TextEmbedding 模型接入统一 embedding 接口，并把 NumPy 向量转换为普通列表。", ["embeddings", "provider-adapter", "local-model"]],
  "mem0/embeddings/gemini.py": ["封装 Google GenAI embedding API，按记忆动作选择 task type，并支持指定输出维度和批量分块。", ["embeddings", "provider-adapter", "google-genai"]],
  "mem0/embeddings/huggingface.py": ["提供 Hugging Face embedding 适配器，可在远程 OpenAI-compatible endpoint 与本地 SentenceTransformer 之间切换。", ["embeddings", "provider-adapter", "huggingface"]],
  "mem0/embeddings/langchain.py": ["把用户提供的 LangChain Embeddings 实例包装为 Mem0 的统一 embedding 接口，并校验所需协议。", ["embeddings", "provider-adapter", "langchain"]],
  "mem0/embeddings/lmstudio.py": ["通过 OpenAI-compatible API 调用本地 LM Studio embedding 服务，支持单条与批量请求及响应数量校验。", ["embeddings", "provider-adapter", "local-inference"]],
  "mem0/embeddings/mock.py": ["提供返回空向量的占位 embedding 实现，供由外部向量服务自行生成 embedding 的场景使用。", ["embeddings", "mock", "adapter"]],
  "mem0/embeddings/ollama.py": ["封装 Ollama embedding API，负责规范化模型名、按需拉取缺失模型，并提供单条和批量向量化。", ["embeddings", "provider-adapter", "ollama"]],
  "mem0/embeddings/openai.py": ["实现 OpenAI embedding 适配器，处理输入清洗、按动作传递 embedding 类型、维度参数以及批量响应排序。", ["embeddings", "provider-adapter", "openai"]],
  "mem0/embeddings/together.py": ["通过 Together 的 OpenAI-compatible client 生成 embedding，并支持批量请求、结果排序和数量一致性校验。", ["embeddings", "provider-adapter", "together-ai"]],
  "mem0/embeddings/vertexai.py": ["实现 Vertex AI embedding 适配器，集中处理 GCP 认证、任务类型映射、输出维度以及分批预测。", ["embeddings", "provider-adapter", "vertex-ai"]],
  "mem0/utils/gcp_auth.py": ["集中处理 GCP 凭据发现，并为 Vertex AI 初始化和 Google GenAI client 创建提供统一入口。", ["authentication", "gcp", "utility"], "凭据解析按内存 service account、文件、环境变量和 Application Default Credentials 的优先级回退。"],
  "mem0/utils/http.py": ["根据字符串或字典代理配置创建同步 httpx client，供 provider 配置复用。", ["http-client", "proxy", "utility"]],

  "mem0/configs/rerankers/base.py": ["定义 reranker provider 共享的 Pydantic 配置字段，包括 provider、model、API key 与 top_k。", ["configuration", "reranking", "data-model"]],
  "mem0/configs/rerankers/cohere.py": ["定义 Cohere reranker 的默认模型以及返回文档和分块数量等 provider 专属配置。", ["configuration", "reranking", "cohere"]],
  "mem0/configs/rerankers/huggingface.py": ["定义 Hugging Face reranker 的模型、设备、批大小、最大长度和分数归一化选项。", ["configuration", "reranking", "huggingface"]],
  "mem0/configs/rerankers/llm.py": ["定义基于 LLM 的 reranker 配置，覆盖模型、采样、输出长度、top_k 以及可嵌套的 LLM provider 配置。", ["configuration", "reranking", "llm"]],
  "mem0/configs/rerankers/sentence_transformer.py": ["定义 SentenceTransformer cross-encoder reranker 的模型、设备、批大小和进度显示选项。", ["configuration", "reranking", "sentence-transformers"]],
  "mem0/configs/rerankers/zero_entropy.py": ["定义 ZeroEntropy reranker 的模型、API key 与 top_k 配置。", ["configuration", "reranking", "zero-entropy"]],
  "mem0/reranker/__init__.py": ["作为 reranker 包入口，集中导出基础接口和各 provider 实现，方便工厂与用户统一导入。", ["entry-point", "barrel", "reranking"]],
  "mem0/reranker/base.py": ["声明 reranker 的抽象接口，约定根据 query 对文档列表重排并返回带分数的结果。", ["reranking", "abstract-base", "interface"], "通过 ABC 定义所有 reranker provider 必须实现的 rerank 契约。"],
  "mem0/reranker/cohere_reranker.py": ["调用 Cohere Rerank API 对多种文档载荷提取出的文本进行排序，并保留原始文档结构和 rerank 分数。", ["reranking", "provider-adapter", "cohere"]],
  "mem0/reranker/huggingface_reranker.py": ["使用 Hugging Face sequence-classification 模型对 query-document 对打分，支持批处理、设备选择、分数归一化和失败回退。", ["reranking", "provider-adapter", "huggingface"]],
  "mem0/reranker/llm_reranker.py": ["逐文档调用可配置 LLM 生成相关性分数，解析并限制到 0 到 1，再排序和应用 top_k；失败时使用中性分数。", ["reranking", "llm", "fault-tolerance"], "将系统评分规则与截断后的用户数据分离为 system/user 消息，以降低 prompt injection 与输入泛滥风险。"],
  "mem0/reranker/sentence_transformer_reranker.py": ["使用 SentenceTransformer CrossEncoder 对 query-document 对预测相关性，排序后返回带分数的文档，并对异常项提供回退。", ["reranking", "cross-encoder", "local-model"]],
  "mem0/reranker/zero_entropy_reranker.py": ["调用 ZeroEntropy rerank 服务处理抽取后的文档文本，恢复原始文档、附加分数并按 top_k 截断。", ["reranking", "provider-adapter", "zero-entropy"]],
  "mem0/utils/factory.py": ["集中维护 LLM、embedding、vector store 与 reranker 的 provider 注册表，通过延迟导入和配置适配创建具体实现。", ["factory", "provider-registry", "dynamic-loading"], "字符串类路径配合 importlib 实现延迟加载，使可选 provider 依赖不会在核心模块导入时全部加载。"],

  "mem0/configs/base.py": ["定义核心 Memory 数据与组合配置模型，把 vector store、LLM、embedder、reranker 和历史存储配置汇聚为单一入口。", ["configuration", "data-model", "composition-root"], "Pydantic 模型把各子系统配置组合成 MemoryConfig，并为对外返回的 MemoryItem 提供稳定结构。"],
  "mem0/configs/llms/azure.py": ["定义 Azure OpenAI 的 provider 专属 LLM 配置，把通用 LLM 参数与 deployment、endpoint、API version 和 headers 组合起来。", ["configuration", "llm", "azure-openai"]],
  "mem0/configs/rerankers/config.py": ["定义顶层 reranker 选择配置，以 provider 名称和可选 provider-specific 字典接入 MemoryConfig。", ["configuration", "reranking", "provider-selection"]],
  "mem0/embeddings/configs.py": ["定义顶层 embedder 选择配置，并在 Pydantic 校验阶段检查内置 provider 名称。", ["configuration", "embeddings", "validation"]],
  "mem0/llms/configs.py": ["定义顶层 LLM provider 配置，并通过校验器限制为核心支持的 provider 集合。", ["configuration", "llm", "validation"]],
  "mem0/vector_stores/configs.py": ["定义 vector store provider 配置，维护 provider 到配置类的动态映射，并把字典转换为相应的强类型配置对象。", ["configuration", "vector-store", "dynamic-loading"], "Pydantic model validator 在实例创建后动态导入 provider 配置类，实现统一入口与按需依赖。"],
};

const symbolSummary = {
  BaseEmbedderConfig: "统一承载所有 embedding provider 的共享与专属参数，并预构造代理 HTTP client、Azure 配置和云端认证字段。",
  AWSBedrockEmbedding: "把 Bedrock Runtime 的多种 embedding 模型请求与响应差异封装在统一 embed 接口后，并可输出归一化向量。",
  AzureOpenAIEmbedding: "使用 Azure OpenAI client 提供单条和批量 embedding，并在 API key 缺失时使用 Azure Identity token。",
  EmbeddingBase: "规定 embedding 适配器的初始化、单条 embed 契约和默认批处理实现。",
  FastEmbedEmbedding: "在本地加载 FastEmbed TextEmbedding 并把首个模型结果转换为可序列化向量。",
  GoogleGenAIEmbedding: "调用 Google GenAI embed_content，并把 memory action 映射为检索文档或查询等 task type。",
  HuggingFaceEmbedding: "根据配置选择远程 Hugging Face endpoint 或本地 SentenceTransformer，并统一单条与批量结果格式。",
  LangchainEmbedding: "校验并代理 LangChain Embeddings 实例的 embed_query 方法。",
  LMStudioEmbedding: "通过本地 OpenAI-compatible endpoint 调用 LM Studio embedding 模型并校验批量结果完整性。",
  MockEmbeddings: "为无需客户端生成向量的后端返回空 embedding 占位值。",
  OllamaEmbedding: "管理 Ollama embedding 模型的名称与可用性，并代理单条和批量 embedding 调用。",
  OpenAIEmbedding: "封装 OpenAI embeddings client，支持 action-aware 输入、可选维度和稳定的批量结果顺序。",
  TogetherEmbedding: "通过 Together endpoint 生成单条或批量 embedding，并校验返回数量。",
  VertexAIEmbedding: "完成 Vertex AI 认证与 TextEmbeddingModel 调用，按记忆动作设置任务类型并分块处理批量输入。",
  GCPAuthenticator: "按确定优先级解析 Google 凭据，并创建 Vertex AI 环境或 Google GenAI client。",
  build_http_client: "把代理字符串或映射转换为 httpx.Client；无代理时返回空值供调用方使用默认 client。",

  BaseRerankerConfig: "提供所有 reranker 配置共享的 provider、model、api_key 与 top_k 字段。",
  CohereRerankerConfig: "扩展通用配置以描述 Cohere 模型和文档返回策略。",
  HuggingFaceRerankerConfig: "描述 Hugging Face reranker 的模型运行设备、批处理和归一化行为。",
  LLMRerankerConfig: "描述用于相关性评分的 LLM、采样参数、嵌套 provider 配置和兼容性 scoring prompt。",
  SentenceTransformerRerankerConfig: "描述本地 CrossEncoder 的模型、设备和批处理选项。",
  ZeroEntropyRerankerConfig: "描述 ZeroEntropy API 的模型、凭据和结果上限。",
  BaseReranker: "规定所有 reranker 必须实现的 query、documents、top_k 输入输出契约。",
  CohereReranker: "调用 Cohere 服务重排文档，同时把服务结果映射回原始文档结构。",
  HuggingFaceReranker: "用 sequence-classification 模型批量计算相关性并可归一化分数，异常时保留可用结果。",
  LLMReranker: "通过 LLM 为每个文档生成受限相关性分数，采用安全消息分层、解析钳制和中性失败回退。",
  SentenceTransformerReranker: "使用 CrossEncoder 预测 query-document 分数，排序、截断并保留异常文档。",
  ZeroEntropyReranker: "调用 ZeroEntropy API 重排文本并将结果索引、分数重新附着到原始文档。",
  load_class: "从完全限定类路径动态导入模块并返回目标类。",
  LlmFactory: "依据 provider 注册表选择 LLM 实现与配置类，兼容基础配置、provider-specific 配置和运行时注册。",
  EmbedderFactory: "依据 provider 名称延迟加载 embedding 适配器，并把字典转换成统一 BaseEmbedderConfig。",
  VectorStoreFactory: "依据 provider 注册表延迟加载向量库实现，统一字典化配置、实例创建和 reset。",
  RerankerFactory: "依据 provider 注册表构造 provider-specific 配置并延迟加载 reranker 实现。",

  MemoryItem: "定义对外暴露的单条记忆记录结构，包括内容、哈希、元数据、相似度和时间戳。",
  MemoryConfig: "作为核心组合配置聚合 vector store、LLM、embedder、reranker、历史数据库和自定义指令。",
  AzureConfig: "承载 Azure 服务通用的密钥、deployment、endpoint、API version 与默认 headers。",
  AzureOpenAIConfig: "在通用 LLM 配置上加入 Azure deployment 参数，并规范化嵌套 AzureConfig。",
  RerankerConfig: "用 provider 加 provider-specific 字典表示顶层 reranker 选择。",
  EmbedderConfig: "用 provider 加配置字典表示顶层 embedder 选择，并在构造时校验 provider。",
  LlmConfig: "用 provider 加配置字典表示顶层 LLM 选择，并在构造时校验 provider。",
  VectorStoreConfig: "维护向量库 provider 到配置类的映射，并动态实例化相应强类型配置。",
};

const symbolTags = (name, fileTags) => {
  const inferred = name.endsWith("Config") || name === "MemoryItem" ? "data-model" : name.endsWith("Factory") ? "factory" : name.includes("Embedding") || name === "MockEmbeddings" ? "embeddings" : name.includes("Reranker") ? "reranking" : name === "build_http_client" ? "utility" : "service";
  return [...new Set([inferred, ...fileTags])].slice(0, 5);
};

const complexityForLines = (lines) => lines > 200 ? "complex" : lines >= 50 ? "moderate" : "simple";
const fileId = (p) => `file:${p}`;
const symbolId = (kind, p, name) => `${kind}:${p}:${name}`;

const inheritance = {
  AWSBedrockEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  AzureOpenAIEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  FastEmbedEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  GoogleGenAIEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  HuggingFaceEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  LangchainEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  LMStudioEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  MockEmbeddings: ["mem0/embeddings/base.py", "EmbeddingBase"],
  OllamaEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  OpenAIEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  TogetherEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  VertexAIEmbedding: ["mem0/embeddings/base.py", "EmbeddingBase"],
  CohereRerankerConfig: ["mem0/configs/rerankers/base.py", "BaseRerankerConfig"],
  HuggingFaceRerankerConfig: ["mem0/configs/rerankers/base.py", "BaseRerankerConfig"],
  LLMRerankerConfig: ["mem0/configs/rerankers/base.py", "BaseRerankerConfig"],
  SentenceTransformerRerankerConfig: ["mem0/configs/rerankers/base.py", "BaseRerankerConfig"],
  ZeroEntropyRerankerConfig: ["mem0/configs/rerankers/base.py", "BaseRerankerConfig"],
  CohereReranker: ["mem0/reranker/base.py", "BaseReranker"],
  HuggingFaceReranker: ["mem0/reranker/base.py", "BaseReranker"],
  LLMReranker: ["mem0/reranker/base.py", "BaseReranker"],
  SentenceTransformerReranker: ["mem0/reranker/base.py", "BaseReranker"],
  ZeroEntropyReranker: ["mem0/reranker/base.py", "BaseReranker"],
  AzureOpenAIConfig: ["mem0/configs/llms/base.py", "BaseLlmConfig"],
};

for (const batchIndex of [4, 5, 6]) {
  const batch = batchesDoc.batches.find((item) => item.batchIndex === batchIndex);
  const extraction = JSON.parse(fs.readFileSync(path.join(ua, `tmp/ua-file-extract-results-${batchIndex}.json`), "utf8"));
  if (!batch || !extraction.scriptCompleted || extraction.filesUnreadable.length) throw new Error(`批次 ${batchIndex} 提取结果不可用`);
  const nodes = [];
  const edges = [];

  for (const result of extraction.results) {
    const [summary, tags, languageNotes] = fileMeta[result.path] ?? [];
    if (!summary || !tags) throw new Error(`缺少文件语义元数据: ${result.path}`);
    const fNode = {
      id: fileId(result.path), type: "file", name: path.basename(result.path), filePath: result.path,
      summary, tags, complexity: complexityForLines(result.nonEmptyLines),
    };
    if (languageNotes) fNode.languageNotes = languageNotes;
    nodes.push(fNode);

    for (const fn of result.functions ?? []) {
      const exported = (result.exports ?? []).some((item) => item.name === fn.name);
      if (!exported && fn.endLine - fn.startLine + 1 < 10) continue;
      const id = symbolId("function", result.path, fn.name);
      nodes.push({id, type: "function", name: fn.name, filePath: result.path, lineRange: [fn.startLine, fn.endLine], summary: symbolSummary[fn.name], tags: symbolTags(fn.name, tags), complexity: complexityForLines(fn.endLine - fn.startLine + 1)});
      edges.push({source: fileId(result.path), target: id, type: "contains", direction: "forward", weight: 1.0});
      if (exported) edges.push({source: fileId(result.path), target: id, type: "exports", direction: "forward", weight: 0.8});
    }

    for (const cls of result.classes ?? []) {
      const exported = (result.exports ?? []).some((item) => item.name === cls.name);
      if (!exported && cls.methods.length < 2 && cls.endLine - cls.startLine + 1 < 20) continue;
      const id = symbolId("class", result.path, cls.name);
      nodes.push({id, type: "class", name: cls.name, filePath: result.path, lineRange: [cls.startLine, cls.endLine], summary: symbolSummary[cls.name], tags: symbolTags(cls.name, tags), complexity: complexityForLines(cls.endLine - cls.startLine + 1)});
      edges.push({source: fileId(result.path), target: id, type: "contains", direction: "forward", weight: 1.0});
      if (exported) edges.push({source: fileId(result.path), target: id, type: "exports", direction: "forward", weight: 0.8});
      if (inheritance[cls.name]) {
        const [targetPath, targetName] = inheritance[cls.name];
        edges.push({source: id, target: symbolId("class", targetPath, targetName), type: "inherits", direction: "forward", weight: 0.9});
      }
    }
  }

  for (const file of batch.files) {
    for (const importedPath of batch.batchImportData[file.path] ?? []) {
      edges.push({source: fileId(file.path), target: fileId(importedPath), type: "imports", direction: "forward", weight: 0.7});
    }
  }

  const expectedImports = batch.files.reduce((sum, file) => sum + (batch.batchImportData[file.path] ?? []).length, 0);
  const actualImports = edges.filter((edge) => edge.type === "imports").length;
  if (expectedImports !== actualImports) throw new Error(`批次 ${batchIndex} import 边数量不匹配: ${actualImports}/${expectedImports}`);
  if (nodes.some((node) => !node.summary || !node.tags?.length || !node.complexity)) throw new Error(`批次 ${batchIndex} 存在不完整节点`);
  if (new Set(nodes.map((node) => node.id)).size !== nodes.length) throw new Error(`批次 ${batchIndex} 存在重复节点 ID`);
  if (nodes.length > 60 || edges.length > 120) throw new Error(`批次 ${batchIndex} 超出单文件限制，需要拆分`);

  fs.writeFileSync(path.join(ua, `intermediate/batch-${batchIndex}.json`), JSON.stringify({nodes, edges}, null, 2) + "\n");
}
