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
    title: 'Agent loads vault catalog',
    desc: 'The agent fetches your vault\'s encrypted resource cards from Swarm. Each card declares capabilities, endpoints (REST + MCP), parameters, and constraints — like ARD\'s ai-catalog.json but private and encrypted.',
    code: `// Fetch vault catalog from Swarm
const vaultCatalog = await agent.loadVaultCatalog();
// → {
//   resources: [
//     { name: "Anthropic", type: "llm",
//       capability: ["text-completion", "image-understanding"],
//       endpoints: { rest: "/v1/messages", mcp: "jsonrpc+anthropic" } },
//     { name: "OpenAI", type: "embeddings",
//       capability: ["embeddings"],
//       endpoints: { rest: "/v1/embeddings" } }
//   ]
// }`,
  },
  {
    title: 'Router checks vault first',
    desc: 'For each request, the router first checks if the needed capability exists in your vault. If yes, it reconstructs the key locally and routes immediately — no external discovery needed.',
    code: `// Check vault for capability match
const need = "text-completion";
const found = vaultCatalog.resources.find(r =>
  r.capability.includes(need)
);

if (found) {
  // ✅ Found in vault — route directly
  return routeFromVault(found);
}

// ❌ Not in vault — query ARD registries
return queryARDRegistries(need);`,
  },
  {
    title: 'Query ARD registries if missing',
    desc: 'If the capability isn\'t in your vault, the router queries external ARD-compliant registries: GitHub Agent Finder, Hugging Face Discover, Ora Directory, Cisco AI Catalog. They return ranked results with URN identifiers, trust manifests, and endpoint URLs.',
    code: `// Query ARD registries via federation
const results = await agent.queryARD({
  text: "geocode address",
  federation: "referrals",
});

// → {
//   results: [
//     { identifier: "urn:air:github.com:mcp:weather-geo",
//       displayName: "Weather & Geocoding MCP Server",
//       score: 92, source: "GitHub Agent Finder" },
//     { identifier: "urn:air:ora.ai:service:mapbox",
//       displayName: "Mapbox Forward Geocoder",
//       score: 87, source: "Ora Directory" }
//   ],
//   referrals: [...]
// }`,
  },
  {
    title: 'User chooses what to add',
    desc: 'The router presents ARD results to the user with trust signals (SOC2 attestations, SPIFFE identities, agent-readiness scorecards). User decides whether to add the key. Once added, future requests use the vault — no repeated discovery.',
    code: `// Present ARD results to user
const choice = await user.prompt({
  message: "This task requires a geocoding API. Add one?",
  options: results.map(r => ({
    label: r.displayName,
    value: r.identifier,
    trust: r.trustManifest?.identity,
    score: r.score
  }))
});

if (choice) {
  // Store new key in vault
  await agent.storeKey(choice.value, {
    type: "maps",
    endpoint: choice.endpoint,
    auth: "Bearer token"
  });
}

// Next time: instant vault route!`,
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

// ===== Routing Demo — Vault + ARD Discovery =====
const routingData = {
  'ai-text': {
    label: 'Need: Text completion',
    status: '✅ Found in vault',
    provider: 'Anthropic → claude-sonnet-4',
    reason: 'Your vault has an Anthropic key. The router matches "text-completion" capability directly to your stored key. No external discovery needed — instant route.',
    chips: [
      { label: 'Source', value: 'Vault (Swarm)' },
      { label: 'Capability', value: 'text-completion' },
      { label: 'Model param', value: 'claude-sonnet-4' },
      { label: 'Transport', value: 'REST / MCP' },
    ],
    ardResult: null,
  },
  'geocode': {
    label: 'Need: Geocode address',
    status: '🔍 Not in vault — querying ARD registries...',
    provider: 'GitHub Agent Finder → weather-geocoding MCP server',
    reason: 'No Maps key in your vault. Router queries GitHub Agent Finder (agentfinder.github.com/api/v1/search) for "geocode" capability. Returns ranked MCP servers with URN identifiers and trust manifests.',
    chips: [
      { label: 'Source', value: 'GitHub Agent Finder' },
      { label: 'URN', value: 'urn:air:github.com:mcp:weather-geo' },
      { label: 'Type', value: 'application/mcp-server-card+json' },
      { label: 'Trust', value: 'SOC2-Type2' },
    ],
    ardResult: {
      source: 'GitHub Agent Finder',
      url: 'https://agentfinder.github.com/api/v1/search',
      results: [
        {
          identifier: 'urn:air:hf.co:weather-mcp:geocode',
          displayName: 'Weather & Geocoding MCP Server',
          type: 'application/mcp-server-card+json',
          score: 92,
          description: 'Geocode addresses and get weather data via Open-Meteo API',
          representativeQueries: ['what is the lat long of Budapest', 'get weather for Tokyo'],
          url: 'https://huggingface.co/spaces/weather-mcp/geocode-server',
        },
        {
          identifier: 'urn:air:github.com:mcp:mapbox-geocoder',
          displayName: 'Mapbox Forward Geocoder',
          type: 'application/mcp-server-card+json',
          score: 87,
          description: 'Convert addresses to geographic coordinates using Mapbox GL',
          representativeQueries: ['find coordinates for this address', 'reverse geocode NYC'],
          url: 'https://github.com/mapbox/mcp-geocoder',
        },
      ],
    },
  },
  'speech-to-text': {
    label: 'Need: Speech → text transcription',
    status: '🔍 Not in vault — querying ARD registries...',
    provider: 'Ora Directory → Soniox STT service',
    reason: 'No STT key in your vault. Router queries Ora Directory (ora.ai/api/ard/search) for "speech-to-text". Ora scans products for agent-readiness and returns verified endpoints with scorecards.',
    chips: [
      { label: 'Source', value: 'Ora Directory' },
      { label: 'URN', value: 'urn:air:ora.ai:service:soniox-stt' },
      { label: 'Type', value: 'application/openapi+json' },
      { label: 'Scorecard', value: 'Agent-ready ✓' },
    ],
    ardResult: {
      source: 'Ora Directory',
      url: 'https://ora.ai/api/ard/search',
      results: [
        {
          identifier: 'urn:air:soniox.com:stt:streaming',
          displayName: 'Soniox Streaming Transcription',
          type: 'application/openapi+json',
          score: 95,
          description: 'Real-time speech-to-text with WebSocket streaming support',
          representativeQueries: ['transcribe audio to text', 'live caption this meeting'],
          url: 'https://docs.soniox.com/api-reference/speech-to-text',
          trustManifest: {
            identity: 'spiffe://soniox.com/stt/streaming',
            attestations: [{ type: 'SOC2-Type2', uri: 'https://trust.soniox.com/soc2' }],
          },
        },
        {
          identifier: 'urn:air:alibabacloud.com:tts:stt',
          displayName: 'Alibaba Cloud ASR',
          type: 'application/openapi+json',
          score: 83,
          description: 'Automatic speech recognition supporting 100+ languages',
          representativeQueries: ['convert voice to text Chinese', 'transcribe podcast episode'],
          url: 'https://www.alibabacloud.com/product/speech',
        },
      ],
    },
  },
  'image-gen': {
    label: 'Need: Generate image',
    status: '🔍 Not in vault — querying ARD registries...',
    provider: 'HF Discover → DALL-E / Stable Diffusion MCP',
    reason: 'No image generation key in your vault. Router queries Hugging Face Discover (hf discover search) for "generate image". HF indexes thousands of ML applications and MCP servers.',
    chips: [
      { label: 'Source', value: 'Hugging Face Discover' },
      { label: 'URN', value: 'urn:air:hf.co:mcp:dall-e-generator' },
      { label: 'Type', value: 'application/mcp-server-card+json' },
      { label: 'Kind', value: 'mcp' },
    ],
    ardResult: {
      source: 'Hugging Face Discover',
      url: 'https://huggingface-hf-discover.hf.space/search',
      results: [
        {
          identifier: 'urn:air:hf.co:mcp:dalle-image-gen',
          displayName: 'DALL-E Image Generator',
          type: 'application/mcp-server-card+json',
          score: 94,
          description: 'Generate images from text prompts using DALL-E 3 API',
          representativeQueries: ['create a logo for my startup', 'generate product photo'],
          url: 'https://huggingface.co/spaces/dalle-mcp/generator',
        },
        {
          identifier: 'urn:air:hf.co:app:sdxl-local',
          displayName: 'Stable Diffusion XL (local)',
          type: 'application/a2a-agent-card+json',
          score: 88,
          description: 'Run SDXL locally on GPU — no API key needed, fully private',
          representativeQueries: ['draw a landscape scene', 'create character art'],
          url: 'https://huggingface.co/spaces/sdxl-local',
        },
      ],
    },
  },
  'embeddings': {
    label: 'Need: Generate embeddings',
    status: '✅ Found in vault',
    provider: 'OpenAI → text-embedding-3-small',
    reason: 'Your vault has an OpenAI key. The router matches "embeddings" capability directly. Selects text-embedding-3-small (1536 dims) as the most cost-effective model.',
    chips: [
      { label: 'Source', value: 'Vault (Swarm)' },
      { label: 'Capability', value: 'embeddings' },
      { label: 'Model param', value: 'text-embedding-3-small' },
      { label: 'Dimensions', value: '1536' },
    ],
    ardResult: null,
  },
  'web-search': {
    label: 'Need: Web search',
    status: '🔍 Not in vault — querying ARD registries...',
    provider: 'Cisco AI Catalog → Brave Search MCP',
    reason: 'No search API key in your vault. Router queries Cisco AI Catalog (ai-catalog.outshift.io) for "web search". Cisco\'s catalog includes enterprise-grade search tools with trust attestations.',
    chips: [
      { label: 'Source', value: 'Cisco AI Catalog' },
      { label: 'URN', value: 'urn:air:cisco.com:mcp:brave-search' },
      { label: 'Type', value: 'application/mcp-server-card+json' },
      { label: 'Trust', value: 'SPIFFE-X509' },
    ],
    ardResult: {
      source: 'Cisco AI Catalog',
      url: 'https://ai-catalog.outshift.io/.well-known/ai-catalog.json',
      results: [
        {
          identifier: 'urn:air:brave.com:search:web',
          displayName: 'Brave Search MCP Server',
          type: 'application/mcp-server-card+json',
          score: 91,
          description: 'Privacy-preserving web search via Brave Search API',
          representativeQueries: ['search the web for latest news', 'find documentation for React'],
          url: 'https://github.com/brave-search/mcp-server',
          trustManifest: {
            identity: 'did:web:brave.com',
            attestations: [{ type: 'GDPR', uri: 'https://brave.com/legal/gdpr' }],
          },
        },
        {
          identifier: 'urn:air:serpapi.com:search:general',
          displayName: 'SerpAPI General Search',
          type: 'application/openapi+json',
          score: 85,
          description: 'Google/Bing/DuckDuckGo search results via unified API',
          representativeQueries: ['search Google for recipes', 'find trending topics'],
          url: 'https://serpapi.com/',
        },
      ],
    },
  },
  'email-send': {
    label: 'Need: Send email',
    status: '🔍 Not in vault — querying ARD registries...',
    provider: 'Ora Directory → SendGrid transactional email',
    reason: 'No email API key in your vault. Router queries Ora Directory for "send email". Ora provides agent-readiness scorecards so you know the service works for agents before adding it.',
    chips: [
      { label: 'Source', value: 'Ora Directory' },
      { label: 'URN', value: 'urn:air:sendgrid.com:email:transactional' },
      { label: 'Type', value: 'application/openapi+json' },
      { label: 'Scorecard', value: 'Agent-ready ✓' },
    ],
    ardResult: {
      source: 'Ora Directory',
      url: 'https://ora.ai/api/ard/search',
      results: [
        {
          identifier: 'urn:air:sendgrid.com:email:tx',
          displayName: 'SendGrid Transactional Email',
          type: 'application/openapi+json',
          score: 96,
          description: 'Send transactional emails with templates, tracking, and analytics',
          representativeQueries: ['send confirmation email', 'notify user about order'],
          url: 'https://docs.sendgrid.com/api-reference/mail-send',
          trustManifest: {
            identity: 'spiffe://sendgrid.com/email',
            attestations: [{ type: 'SOC2-Type2', uri: 'https://sendgrid.com/trust/soc2' }],
          },
        },
        {
          identifier: 'urn:air:aws.amazon.com:ses:email',
          displayName: 'AWS SES Email Service',
          type: 'application/openapi+json',
          score: 89,
          description: 'Amazon Simple Email Service — scalable, cost-effective email sending',
          representativeQueries: ['bulk email campaign', 'verify user email address'],
          url: 'https://docs.aws.amazon.com/ses/',
        },
      ],
    },
  },
  'pptx-create': {
    label: 'Need: Create PowerPoint presentation',
    status: '🔍 Not in vault — querying ARD registries...',
    provider: 'HF Discover → pptx-creator Skill',
    reason: 'No presentation tool in your vault. Router queries Hugging Face Discover for "create PowerPoint". Finds Skills and MCP servers that generate branded presentations.',
    chips: [
      { label: 'Source', value: 'Hugging Face Discover' },
      { label: 'URN', value: 'urn:air:github.com:pptx-creator' },
      { label: 'Type', value: 'application/ai-skill+md' },
      { label: 'Kind', value: 'skill' },
    ],
    ardResult: {
      source: 'Hugging Face Discover',
      url: 'https://huggingface-hf-discover.hf.space/search',
      results: [
        {
          identifier: 'urn:air:github.com:alice-dev:pptx-creator',
          displayName: 'PPTX Creator',
          type: 'application/ai-skill+md',
          score: 90,
          description: 'Create professional PowerPoint presentations following brand guidelines',
          representativeQueries: ['make a pitch deck', 'create training slides'],
          url: 'https://github.com/alice-dev/pptx-creator',
        },
        {
          identifier: 'urn:air:hf.co:mcp:slide-generator',
          displayName: 'Slide Generator MCP',
          type: 'application/mcp-server-card+json',
          score: 84,
          description: 'Generate slide decks from markdown or natural language input',
          representativeQueries: ['turn this blog post into slides', 'create quarterly report deck'],
          url: 'https://huggingface.co/spaces/slide-generator',
        },
      ],
    },
  },
};

const routingButtons = document.querySelectorAll('.routing-btn');
const routingResult = document.getElementById('routingResult');

function renderRouting(request) {
  const data = routingData[request];
  let resultHTML = `
    <div class="routing-result__label">${data.label}</div>
    <div class="routing-result__provider">${data.status}</div>
    ${data.provider ? `<div style="font-size:1.1rem;font-weight:600;color:var(--accent);margin-bottom:12px;">${data.provider}</div>` : ''}
    <div class="routing-result__reason">${data.reason}</div>
    <div class="routing-result__meta">
      ${data.chips.map(c => `
        <span class="routing-result__chip">${c.label}: <strong>${c.value}</strong></span>
      `).join('')}
    </div>
  `;

  // Show ARD results if available
  if (data.ardResult && data.ardResult.results) {
    resultHTML += `
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-dim);margin-bottom:12px;">
          📡 Results from ${data.ardResult.source} (${data.ardResult.url})
        </div>
    `;
    data.ardResult.results.forEach((r, i) => {
      resultHTML += `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-weight:700;font-size:0.95rem;">${r.displayName}</span>
            <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent);">score: ${r.score}</span>
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:6px;">${r.description}</div>
          <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-dim);word-break:break-all;">${r.identifier}</div>
          ${r.trustManifest ? `<div style="margin-top:6px;font-size:0.75rem;color:var(--accent-3);">🛡️ ${r.trustManifest.identity}</div>` : ''}
        </div>
      `;
    });
    resultHTML += '</div>';
  }

  routingResult.innerHTML = resultHTML;
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
