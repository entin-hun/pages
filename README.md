# 🔐 SwarmKey Protocol

> A decentralized BYOK (Bring Your Own Key) API key wallet built on Swarm. Your keys, your control, no middleman.

**Live demo:** _(deploy to GitHub Pages — see below)_

## What is this?

SwarmKey is a concept demo for a peer-to-peer protocol that lets users store, route, and use API keys — without handing them to a central server. Keys are encrypted and sharded on the Swarm network using Access Control Trie (ACT). An agent runtime reconstructs keys locally at call time.

This repository contains a static website that explains the protocol to both technical and non-technical audiences.

## Features

- 📱 **Responsive** — works on mobile, tablet, desktop
- 🌙 **Dark mode** — with light mode toggle
- 🎨 **Interactive demos** — walkthrough, routing simulator, policy manifest viewer
- ⚡ **No build step** — vanilla HTML/CSS/JS, deploy instantly to GitHub Pages
- ♿ **Accessible** — semantic HTML, keyboard navigation

## Sections

1. **Hero** — the elevator pitch
2. **Problem** — why centralized key management is broken
3. **Solution** — how SwarmKey works (4-step flow)
4. **How It Works** — interactive 5-step walkthrough of a real request
5. **Category-Based Routing** — interactive demo + policy manifest
6. **P2P Toolset Registry** — decentralized tool catalog diagram
7. **Comparison** — SwarmKey vs Composio / Fga.dev / DIY
8. **Use Cases** — docs chatbots, AI agents, team vaults, SaaS, marketplace
9. **FAQ** — the hard questions

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g., `swarmkey-protocol`)
2. Push these files to the `main` branch
3. Go to **Settings → Pages**
4. Under **Source**, select `Deploy from a branch`
5. Choose `main` branch and `/ (root)` folder
6. Click **Save**
7. Your site will be live at `https://<your-username>.github.io/swarmkey-protocol/`

### Alternative: GitHub Actions deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Local development

No dependencies needed. Just open `index.html` in a browser, or run a simple server:

```bash
# Python
python3 -m http.server 8000

# Node (if you have npx)
npx serve
```

Then visit `http://localhost:8000`.

## Tech stack

- **HTML5** — semantic markup
- **CSS3** — custom properties, grid, flexbox, animations
- **Vanilla JS** — no frameworks, no dependencies
- **Fonts** — Inter + JetBrains Mono (Google Fonts)

## Key concepts

### Access Control Trie (ACT)

Swarm's built-in chunk-level access control. Publishers grant access to specific users by their public keys. Revocation is instant. Only authorized grantees can decrypt content.

[ACT docs →](https://docs.ethswarm.org/docs/concepts/access-control)

### Postage stamps

Swarm's storage payment mechanism. Storing ~13 KB (a manifest + 3 key shards) for a year costs roughly **$0.20**.

### Category-based routing

A policy manifest defines which provider/key to use for each request category (code, summary, vision, simple, embed). The agent runtime reads the manifest and routes automatically.

### P2P toolset registry

Tool manifests are stored as content-addressed chunks on Swarm. No central server, no single point of failure, impossible to censor.

## Inspiration

- [Composio](https://github.com/composiohq/composio) — centralized tool registry for AI agents
- [Fga.dev](https://docs.fga.dev/) — centralized policy engine
- [Swarm](https://docs.ethswarm.org/) — decentralized storage network

## License

MIT — use it, fork it, build on it.

## Disclaimer

This is a **concept demo** illustrating a protocol design. The Swarm infrastructure (ACT, postage stamps, Bee nodes) is live and production-ready. The SwarmKey SDK and reference implementation are the proposed next step. Not affiliated with Swarm Foundation.
