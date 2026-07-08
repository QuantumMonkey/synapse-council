# Synapse Council

A multi-agent, offline-capable AI debate arena designed to act as a rigorous sounding board for complex ideas. Synapse Council orchestrates a panel of diverse AI personas (e.g., The Architect, The Tenth Man, The Pragmatist) to debate concepts, challenge assumptions, and synthesize insights.

Rather than trying to build a bloated all-in-one note-taking app, Synapse Council embraces the Unix philosophy: it does one thing—structured AI debate—exceptionally well. It exports standard Markdown files directly to your local file system, ready to be ingested by your favorite "Second Brain" tools like Obsidian or Logseq.

## Features

- **Multi-Agent Debates:** Configure multiple LLM personas to argue different sides of a topic.
- **Local First & Secure:** Designed to be wrapped as a local executable. Your API keys are encrypted via OS-level enclaves (Windows Credential Manager / Android Keystore), completely bypassing the risks of browser `localStorage`.
- **Bring Your Own Keys (BYOK):** Use Gemini, Groq, OpenRouter, and more. Choose cheap models for the debaters and a highly capable model for the Moderator.
- **Raw Markdown Export:** Automatically saves dense, semantic summaries of debates as clean `.md` files for your personal vault.
- **Eleventh Man Evaluation:** Dedicated skeptical agents ensure you aren't stuck in an AI echo chamber.

## Architecture

Synapse Council has transitioned from an open web server to a self-contained ecosystem:
- **Frontend:** HTML/CSS/JS with a futuristic, glassmorphic UI.
- **Desktop (Upcoming):** Tauri (Rust) for bundling into a secure `.exe`.
- **Mobile (Upcoming):** Capacitor for bundling into a secure `.apk`.

## Security Model

Your API keys are never stored in plain text. By utilizing OS-level secure storage, the application achieves a true 'zero-trust' local environment. The data is locked in the app and your local file system.

## Setup

1. Clone the repository.
2. Open `public/gateway.html` (the Security Gateway) to configure your API keys.
3. Open `public/index.html` to enter the Arena Mode and start a debate.

*(Note: Tauri and Capacitor build pipelines are currently in development. Run the frontend locally in the meantime).*

## License

MIT License
