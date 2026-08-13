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


// ===== Provider Grid Cursor Tracking =====
const providerGrid = document.querySelector('.provider-grid');
if (providerGrid) {
  providerGrid.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.provider');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
}

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
