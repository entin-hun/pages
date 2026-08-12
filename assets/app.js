// ===== Theme Toggle =====
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.nav__theme-icon');
const html = document.documentElement;

// Check saved theme or system preference
const savedTheme = localStorage.getItem('swarmkey-theme');
if (savedTheme) {
  html.setAttribute('data-theme', savedTheme);
  themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
  html.setAttribute('data-theme', 'light');
  themeIcon.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  themeIcon.textContent = next === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('swarmkey-theme', next);
});

// ===== Nav scroll effect =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

// ===== Walkthrough =====
const walkthroughData = [
  {
    title: 'User asks a question',
    desc: 'A visitor lands on your docs site and types a question into the chatbot. The question is sent to the SwarmKey agent runtime running in their browser.',
    code: `// User input
const question = "How do I configure authentication?";

// Agent runtime initializes
const agent = new SwarmKeyAgent({
  manifest: "bzz://abc123.../manifest.json",
  // user's seed phrase (stored in browser, never sent)
  seed: await getUserSeed(),
});`,
  },
  {
    title: 'Agent loads resource catalog',
    desc: 'The agent fetches the capability catalog from Swarm by its content hash. Each resource declares its capabilities, endpoints (REST + MCP), parameters, and constraints — like ARD\'s ai-catalog.json but encrypted on Swarm.',
    code: `// Fetch catalog from Swarm
const catalog = await agent.loadCatalog();
// → {
//   resources: [
//     { name: "Anthropic", type: "llm",
//       capability: ["text-completion", "image-understanding"],
//       endpoints: { rest: "/v1/messages", mcp: "jsonrpc+anthropic" } },
//     { name: "Mapbox", type: "maps",
//       capability: ["geocode", "reverse-geocode"],
//       endpoints: { rest: "/geocoding/v5/..." } },
//     ...
//   ]
// }`,
  },
  {
    title: 'Key reconstructed locally',
    desc: 'The router identifies which resource handles this request\'s capability. It fetches the encrypted shards from Swarm and reconstructs the API key in memory — using the user\'s seed phrase. The key never touches disk or a server.',
    code: `// Reconstruct key from Swarm shards
const key = await agent.reconstructKey({
  resource: "Anthropic",
  shardRefs: catalog.resources[0].keyRef,
});
// key exists in memory for milliseconds only
// → "sk-ant-api03-..."`,
  },
  {
    title: 'Router matches capability → endpoint',
    desc: 'The routing layer reads the catalog and matches the request\'s needed capability ("text-completion") to the right resource. It selects the best model from your Anthropic key lineup, constructs the correct endpoint URL with proper headers, and validates parameters against the resource card schema.',
    code: `// Capability-based routing
const route = agent.route({
  need: "text-completion",
  input: question,
});
// → {
//   resource: "Anthropic",
//   endpoint: "/v1/messages",
//   transport: "rest", // or "mcp" if available
//   model: "claude-sonnet-4",
//   params: { maxTokens: 4096, temperature: 0.7 }
// }`,
  },
  {
    title: 'API called, answer returned',
    desc: 'The agent calls the LLM API directly with the reconstructed key. The response flows back to the chatbot UI. The key is wiped from memory. The entire process took milliseconds, and no server ever saw the plaintext key.',
    code: `// Call LLM API directly
const response = await agent.call({
  provider: route.provider,
  model: route.model,
  messages: [{ role: "user", content: question }],
});

// Display answer, wipe key from memory
displayAnswer(response.content);
agent.wipeKey(); // key gone`,
  },
];

const walkthroughSteps = document.querySelectorAll('.walkthrough__step');
const walkthroughPanel = document.getElementById('walkthroughPanel');

function renderWalkthrough(index) {
  const data = walkthroughData[index];
  walkthroughPanel.innerHTML = `
    <h3>${data.title}</h3>
    <p>${data.desc}</p>
    <pre class="walkthrough__code"><code>${escapeHtml(data.code)}</code></pre>
  `;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

walkthroughSteps.forEach((step, i) => {
  step.addEventListener('click', () => {
    walkthroughSteps.forEach(s => s.classList.remove('is-active'));
    step.classList.add('is-active');
    renderWalkthrough(i);
  });
});

// Render first step on load
renderWalkthrough(0);

// ===== Routing Demo — Federated Resource Discovery =====
const routingData = {
  'ai-text': {
    label: 'Need: AI text completion',
    provider: 'Anthropic → claude-sonnet-4',
    reason: 'Capability match: "text-completion" maps to Anthropic\'s chat endpoint. The router checks your vault\'s ai-catalog.json card, finds Anthropic supports this capability, selects sonnet-4 as the best model for quality/cost ratio.',
    chips: [
      { label: 'Capability', value: 'text-completion' },
      { label: 'Endpoint', value: '/v1/messages' },
      { label: 'Model param', value: 'claude-sonnet-4' },
      { label: 'Transport', value: 'REST / MCP' },
    ],
  },
  'ai-vision': {
    label: 'Need: AI image understanding',
    provider: 'Anthropic → claude-sonnet-4 (vision)',
    reason: 'Capability match: "image-understanding" requires multimodal support. Anthropic\'s card declares vision capability on sonnet-4. Router passes the image as base64 in the message payload.',
    chips: [
      { label: 'Capability', value: 'image-understanding' },
      { label: 'Endpoint', value: '/v1/messages' },
      { label: 'Model param', value: 'claude-sonnet-4-vision' },
      { label: 'Input format', value: 'base64 / URL' },
    ],
  },
  'geocode': {
    label: 'Need: Geocode address',
    provider: 'Mapbox → /mapbox-gl/geocoding/v5',
    reason: 'Capability match: "geocode" maps to Mapbox Forward Geocoding API. Your vault\'s Mapbox card declares this endpoint with parameters: query (required), country (optional), limit (default: 5). Router constructs the request URL with your key.',
    chips: [
      { label: 'Capability', value: 'geocode' },
      { label: 'Endpoint', value: '/geocoding/v5/{dataset}/{query}' },
      { label: 'Cost', value: '$0.50/1K req' },
      { label: 'Auth', value: 'Bearer token' },
    ],
  },
  'reverse-geocode': {
    label: 'Need: Reverse geocode coordinates',
    provider: 'Mapbox → /mapbox-gl/geocoding/v5',
    reason: 'Same Mapbox endpoint, different operation. The router detects lat/lng input and switches to reverse geocoding mode. Parameters: longitude, latitude, radius, bbox — all validated against the resource card schema.',
    chips: [
      { label: 'Capability', value: 'reverse-geocode' },
      { label: 'Endpoint', value: '/geocoding/v5/{dataset}/{lon},{lat}' },
      { label: 'Cost', value: '$0.50/1K req' },
      { label: 'Auth', value: 'Bearer token' },
    ],
  },
  'speech-to-text': {
    label: 'Need: Speech → text transcription',
    provider: 'Soniox → /soniox/speech_to_text/v2',
    reason: 'Capability match: "speech-to-text" maps to Soniox streaming transcription. Your vault\'s Soniox card declares audio format support (wav, mp3), language codes (en, hu, de), and max duration (300s). Router formats the audio chunk and sets headers.',
    chips: [
      { label: 'Capability', value: 'speech-to-text' },
      { label: 'Endpoint', value: '/speech_to_text/v2' },
      { label: 'Audio format', value: 'wav / mp3' },
      { label: 'Cost', value: '$0.004/min' },
    ],
  },
  'text-to-speech': {
    label: 'Need: Text → speech synthesis',
    provider: 'Alibaba Cloud → /nmt-tts/api/v21/tts',
    reason: 'Capability match: "text-to-speech" maps to Alibaba Cloud Neural MT TTS. Your vault\'s card declares voice options (female/male, zh-CN/en-US), output formats (mp3/wav), and speed range (0.5x–2.0x). Router selects the best voice for the input language.',
    chips: [
      { label: 'Capability', value: 'text-to-speech' },
      { label: 'Endpoint', value: '/nmt-tts/api/v21/tts' },
      { label: 'Output', value: 'mp3 / wav' },
      { label: 'Cost', value: '¥0.02/1K chars' },
    ],
  },
  'embeddings': {
    label: 'Need: Generate embeddings',
    provider: 'OpenAI → /openai/embeddings',
    reason: 'Capability match: "embeddings" maps to OpenAI embedding endpoint. Your vault\'s OpenAI card declares model variants (text-embedding-3-small, text-embedding-3-large), dimensions (1536/3072), and token limits (8191). Router picks the smallest model that meets accuracy requirements.',
    chips: [
      { label: 'Capability', value: 'embeddings' },
      { label: 'Endpoint', value: '/v1/embeddings' },
      { label: 'Model param', value: 'text-embedding-3-small' },
      { label: 'Dimensions', value: '1536 / 3072' },
    ],
  },
  'web-search': {
    label: 'Need: Web search',
    provider: 'Brave Search → /brave/search/v1/web',
    reason: 'Capability match: "web-search" maps to Brave Search API. Your vault\'s Brave card declares query params, count (1–20), freshness filters, and safe-search levels. Router constructs the search query with appropriate filters based on context.',
    chips: [
      { label: 'Capability', value: 'web-search' },
      { label: 'Endpoint', value: '/search/v1/web' },
      { label: 'Max results', value: '1–20' },
      { label: 'Cost', value: '$0.005/search' },
    ],
  },
  'email-send': {
    label: 'Need: Send email',
    provider: 'SendGrid → /sendgrid/v3/mail/send',
    reason: 'Capability match: "email-send" maps to SendGrid Mail Send API. Your vault\'s SendGrid card declares template support, attachment limits (30MB), rate limits (100/sec), and tracking options. Router validates the email structure against the card schema before sending.',
    chips: [
      { label: 'Capability', value: 'email-send' },
      { label: 'Endpoint', value: '/v3/mail/send' },
      { label: 'Attachment', value: '≤ 30 MB' },
      { label: 'Rate limit', value: '100 req/sec' },
    ],
  },
  'pdf-parse': {
    label: 'Need: Parse PDF table',
    provider: 'Anthropic → claude-sonnet-4 (vision + parsing)',
    reason: 'Capability match: "document-parsing" can be handled by Claude\'s vision endpoint (PDF rendered as image) or by a dedicated OCR service. Router prefers Claude (already in vault) over adding a new OCR key. Falls back to AWS Textract if document is scanned-only.',
    chips: [
      { label: 'Capability', value: 'document-parsing' },
      { label: 'Endpoint', value: '/v1/messages (vision)' },
      { label: 'Fallback', value: 'AWS Textract' },
      { label: 'Format', value: 'PDF / image' },
    ],
  },
};

const routingButtons = document.querySelectorAll('.routing-btn');
const routingResult = document.getElementById('routingResult');

function renderRouting(request) {
  const data = routingData[request];
  routingResult.innerHTML = `
    <div class="routing-result__label">${data.label}</div>
    <div class="routing-result__provider">${data.provider}</div>
    <div class="routing-result__reason">${data.reason}</div>
    <div class="routing-result__meta">
      ${data.chips.map(c => `
        <span class="routing-result__chip">${c.label}: <strong>${c.value}</strong></span>
      `).join('')}
    </div>
  `;
}

routingButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    routingButtons.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderRouting(btn.dataset.request);
  });
});

// Render default
renderRouting('ai-text');

// ===== Policy manifest code =====
const policyCode = document.getElementById('policyCode');
const policyManifest = `{
  "version": "1.0",
  "discovery": {
    "spec": "ARD-compatible ai-catalog.json on Swarm",
    "storage": "bzz://<manifest-hash>/ai-catalog.json",
    "access": "ACT-encrypted, grantee-based"
  },
  "resources": [
    {
      "name": "Anthropic Claude",
      "type": "llm",
      "capability": ["text-completion", "image-understanding", "document-parsing"],
      "endpoints": {
        "rest": "/v1/messages",
        "mcp": "jsonrpc+anthropic://claude"
      },
      "models": [
        { "name": "claude-sonnet-4", "cost": "$0.015/1K tokens", "use": ["code", "vision", "parsing"] },
        { "name": "claude-haiku", "cost": "$0.0025/1K tokens", "use": ["summarize", "translate", "chat"] }
      ],
      "constraints": { "maxTokens": 8192, "region": "us-east-1" }
    },
    {
      "name": "Mapbox GL",
      "type": "maps",
      "capability": ["geocode", "reverse-geocode", "directions", "map-tiles"],
      "endpoints": {
        "rest": "/mapbox-gl/geocoding/v5/{dataset}/{query}",
        "geojson": true
      },
      "parameters": { "query": "required", "country": "optional", "limit": "default:5" },
      "cost": "$0.50/1K requests",
      "auth": "Bearer token"
    },
    {
      "name": "Soniox STT",
      "type": "speech-to-text",
      "capability": ["speech-to-text", "live-transcription"],
      "endpoints": {
        "rest": "/soniox/speech_to_text/v2",
        "websocket": "wss://api.soniox.com/stt-stream"
      },
      "audioFormats": ["wav", "mp3", "flac"],
      "languages": ["en", "hu", "de", "fr", "es"],
      "cost": "$0.004/min",
      "auth": "API key header"
    },
    {
      "name": "Alibaba Cloud TTS",
      "type": "text-to-speech",
      "capability": ["text-to-speech", "voice-synthesis"],
      "endpoints": {
        "rest": "/nmt-tts/api/v21/tts"
      },
      "voices": ["female-zh-CN", "male-en-US", "female-en-US"],
      "outputFormats": ["mp3", "wav"],
      "speedRange": "0.5x–2.0x",
      "cost": "¥0.02/1K chars",
      "auth": "AccessKey ID/Secret"
    },
    {
      "name": "OpenAI Embeddings",
      "type": "embeddings",
      "capability": ["embeddings", "vector-search"],
      "endpoints": {
        "rest": "/v1/embeddings",
        "mcp": "jsonrpc+openai://embeddings"
      },
      "models": ["text-embedding-3-small", "text-embedding-3-large"],
      "dimensions": [1536, 3072],
      "tokenLimit": 8191,
      "cost": "$0.0001/1K tokens",
      "auth": "Bearer token"
    },
    {
      "name": "Brave Search",
      "type": "search",
      "capability": ["web-search", "news-search", "lite-search"],
      "endpoints": {
        "rest": "/brave/search/v1/web"
      },
      "parameters": { "count": "1–20", "freshness": "pd|pp|pt", "safe": "moderate|strict|off" },
      "cost": "$0.005/search",
      "auth": "Ocp-Apim-Subscription-Key"
    },
    {
      "name": "SendGrid Mail",
      "type": "email",
      "capability": ["email-send", "email-template"],
      "endpoints": {
        "rest": "/v3/mail/send"
      },
      "parameters": { "attachment": "≤30MB", "rateLimit": "100/sec", "templates": true },
      "cost": "Free tier: 100/day",
      "auth": "Bearer SG.*"
    }
  ],
  "routing": {
    "ai-text": { "capability": "text-completion", "preferred": "Anthropic", "fallback": null },
    "ai-vision": { "capability": "image-understanding", "preferred": "Anthropic", "fallback": null },
    "geocode": { "capability": "geocode", "preferred": "Mapbox", "fallback": "Google Maps" },
    "reverse-geocode": { "capability": "reverse-geocode", "preferred": "Mapbox", "fallback": "Google Maps" },
    "speech-to-text": { "capability": "speech-to-text", "preferred": "Soniox", "fallback": "Alibaba STT" },
    "text-to-speech": { "capability": "text-to-speech", "preferred": "Alibaba TTS", "fallback": null },
    "embeddings": { "capability": "embeddings", "preferred": "OpenAI", "fallback": null },
    "web-search": { "capability": "web-search", "preferred": "Brave", "fallback": null },
    "email-send": { "capability": "email-send", "preferred": "SendGrid", "fallback": null },
    "pdf-parse": { "capability": "document-parsing", "preferred": "Anthropic (vision)", "fallback": "AWS Textract" }
  },
  "policy": {
    "approved": true,
    "regions": ["us-east-1", "eu-west-1"],
    "compliance": ["GDPR", "SOC2"],
    "spendCap": { "perDay": "$10", "perCategory": { "ai": "$5", "maps": "$2", "other": "$3" } }
  }
}`;

// Syntax highlight (simple)
function highlightJson(json) {
  return json
    .replace(/(&|<|>)/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]))
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+\.?\d*)/g, (match) => {
      let cls = 'json-num';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-str';
      } else if (/true|false/.test(match)) {
        cls = 'json-bool';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
}

// Add syntax highlight styles
const style = document.createElement('style');
style.textContent = `
  .json-key { color: #f5a623; }
  .json-str { color: #00d2a0; }
  .json-num { color: #6c5ce7; }
  .json-bool { color: #ff6b6b; }
  .json-null { color: #9999aa; }
`;
document.head.appendChild(style);

policyCode.innerHTML = highlightJson(policyManifest);

// ===== Smooth scroll for nav links =====
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== Intersection observer for fade-in =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.problem-card, .solution-step, .usecase-card, .registry-feature, .routing-why__card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
  observer.observe(el);
});
