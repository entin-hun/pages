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
    title: 'Agent loads manifest',
    desc: 'The agent fetches the tool manifest from Swarm by its content hash. The manifest describes available tools, routing policies, and which key categories are needed.',
    code: `// Fetch manifest from Swarm
const manifest = await agent.loadManifest();
// → {
//   tools: [...],
//   routing: { "code": "anthropic", "summary": "openai" },
//   keys: { "anthropic": "bzz://key1...", "openai": "bzz://key2..." }
// }`,
  },
  {
    title: 'Key reconstructed locally',
    desc: 'The agent identifies which key category this request needs (e.g., "code" → Anthropic). It fetches the encrypted shards from Swarm and reconstructs the API key in memory — using the user\'s seed phrase. The key never touches disk or a server.',
    code: `// Reconstruct key from Swarm shards
const key = await agent.reconstructKey({
  category: "code",
  shardRefs: manifest.keys.anthropic,
});
// key exists in memory for milliseconds only
// → "sk-ant-api03-..."`,
  },
  {
    title: 'Smart routing picks model',
    desc: 'The routing layer checks what you have (Anthropic Claude) and what the request needs. For code → claude-sonnet-4. For simple chat → claude-haiku. The router picks the cheapest capable model from your key\'s lineup.',
    code: `// Policy-based routing — single key
const route = agent.route({
  category: "code",
  question: question,
});
// → { provider: "anthropic", model: "claude-sonnet-4",
//     reason: "best for structured output" }`,
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

// ===== Routing Demo =====
const routingData = {
  'write-code': {
    label: 'Request: Write code',
    provider: 'Anthropic → claude-sonnet-4',
    reason: 'Claude excels at structured code output. The router picks sonnet-4 from your Anthropic key lineup — it\'s the sweet spot for code quality vs cost.',
    chips: [
      { label: 'Model', value: 'claude-sonnet-4' },
      { label: 'Cost', value: '~$0.015/1K tokens' },
      { label: 'Key source', value: 'Anthropic (vault)' },
    ],
  },
  'summarize': {
    label: 'Request: Summarize text',
    provider: 'Anthropic → claude-haiku',
    reason: 'Summarization is a simple task. The router downgrades to haiku (the cheapest Claude model) — same key, fraction of the cost. No need for sonnet on easy tasks.',
    chips: [
      { label: 'Model', value: 'claude-haiku' },
      { label: 'Cost', value: '~$0.0025/1K tokens' },
      { label: 'Key source', value: 'Anthropic (vault)' },
    ],
  },
  'analyze-image': {
    label: 'Request: Analyze image',
    provider: 'Anthropic → claude-sonnet-4 (vision)',
    reason: 'Your Anthropic key supports vision via Claude. The router detects the image input and routes to sonnet-4 which has native vision capability. No extra key needed.',
    chips: [
      { label: 'Model', value: 'claude-sonnet-4-vision' },
      { label: 'Cost', value: '~$0.015/1K tokens' },
      { label: 'Key source', value: 'Anthropic (vault)' },
    ],
  },
  'translate': {
    label: 'Request: Translate text',
    provider: 'Anthropic → claude-haiku',
    reason: 'Translation is well within Claude\'s capabilities. Haiku handles it perfectly at near-zero cost. The router knows this from the manifest metadata.',
    chips: [
      { label: 'Model', value: 'claude-haiku' },
      { label: 'Cost', value: '~$0.0025/1K tokens' },
      { label: 'Key source', value: 'Anthropic (vault)' },
    ],
  },
  'speech-to-text': {
    label: 'Request: Speech → text',
    provider: '⚠️ Gap detected: Soniox or Alibaba Cloud STT',
    reason: 'Your vault only has an LLM key. Speech-to-text requires a dedicated STT service. The router flags this gap and offers options: add a Soniox key (~$0.004/min), use Alibaba Cloud STT, or transcribe externally first.',
    chips: [
      { label: 'Status', value: 'Gap detected' },
      { label: 'Suggested', value: 'Soniox / Alibaba' },
      { label: 'Cost', value: '~$0.004/min' },
    ],
  },
  'maps': {
    label: 'Request: Find nearby restaurants',
    provider: '⚠️ Gap detected: Mapbox or Google Maps API',
    reason: 'Maps queries require a geospatial API. Your LLM key can\'t do this natively. The router suggests adding Mapbox ($0.50/1K requests) or Google Maps ($2.00/1K requests). Without it, Claude can only guess locations.',
    chips: [
      { label: 'Status', value: 'Gap detected' },
      { label: 'Suggested', value: 'Mapbox / Google' },
      { label: 'Cost', value: '$0.50–$2.00/1K req' },
    ],
  },
  'generate-image': {
    label: 'Request: Generate image',
    provider: '⚠️ Gap detected: DALL-E or Stable Diffusion',
    reason: 'Image generation needs a dedicated model. Claude can describe images but not create them. The router suggests DALL-E 3 (via OpenAI key) or Stable Diffusion (local). Consider adding an image gen key.',
    chips: [
      { label: 'Status', value: 'Gap detected' },
      { label: 'Suggested', value: 'DALL-E 3 / SDXL' },
      { label: 'Cost', value: '~$0.020/image' },
    ],
  },
  'extract-data': {
    label: 'Request: Extract table from PDF',
    provider: 'Anthropic → claude-sonnet-4 (vision + parsing)',
    reason: 'Claude can read PDFs directly via vision. The router routes to sonnet-4 which can parse tables from documents. No extra key needed — your existing LLM key handles this.',
    chips: [
      { label: 'Model', value: 'claude-sonnet-4' },
      { label: 'Cost', value: '~$0.015/1K tokens' },
      { label: 'Key source', value: 'Anthropic (vault)' },
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
renderRouting('write-code');

// ===== Policy manifest code =====
const policyCode = document.getElementById('policyCode');
const policyManifest = `{
  "version": "1.0",
  "vault": {
    "llm": {
      "provider": "anthropic",
      "keyRef": "bzz://key-anthropic-...",
      "models": [
        { "name": "claude-sonnet-4", "cost": "$0.015/1K tokens", "use": ["code", "vision", "parsing"] },
        { "name": "claude-haiku", "cost": "$0.0025/1K tokens", "use": ["summarize", "translate", "chat"] }
      ]
    }
  },
  "routing": {
    "write-code": { "model": "claude-sonnet-4", "reason": "best for structured output" },
    "summarize": { "model": "claude-haiku", "reason": "cheap, sufficient quality" },
    "analyze-image": { "model": "claude-sonnet-4-vision", "reason": "native vision support" },
    "translate": { "model": "claude-haiku", "reason": "well within haiku's capability" },
    "extract-data": { "model": "claude-sonnet-4", "reason": "can parse PDFs via vision" },
    "speech-to-text": { "gap": true, "suggested": ["soniox", "alibaba-stt"], "note": "LLM key cannot transcribe audio" },
    "maps": { "gap": true, "suggested": ["mapbox", "google-maps"], "note": "requires geospatial API" },
    "generate-image": { "gap": true, "suggested": ["dall-e-3", "sdxl"], "note": "LLM can describe but not generate images" }
  },
  "fallback": {
    "strategy": "prompt-user",
    "message": "This task requires a key not in your vault. Add one or use a workaround."
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
