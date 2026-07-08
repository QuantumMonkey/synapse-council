import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // support large transcripts
app.use(express.static('public'));

// Helper to get key (from env or client override)
function getApiKey(provider, clientKeys) {
  const envKeyName = `${provider.toUpperCase()}_API_KEY`;
  return process.env[envKeyName] || (clientKeys && clientKeys[provider]);
}

// POST endpoint to handle chat requests
app.post('/api/chat', async (req, res) => {
  const { provider, model, messages, systemInstruction, temperature, keys } = req.body;

  let apiKey;
  if (provider === 'gemini_personal') {
    apiKey = process.env.GEMINI_API_KEY_PERSONAL || (keys && keys.gemini_personal) || process.env.GEMINI_API_KEY || (keys && keys.gemini);
  } else if (provider === 'gemini_work') {
    apiKey = process.env.GEMINI_API_KEY_WORK || (keys && keys.gemini_work) || process.env.GEMINI_API_KEY || (keys && keys.gemini);
  } else if (provider === 'gemini_moderator') {
    apiKey = process.env.GEMINI_API_KEY_MODERATOR || (keys && keys.gemini_moderator) || process.env.GEMINI_API_KEY_PERSONAL || (keys && keys.gemini_personal) || process.env.GEMINI_API_KEY || (keys && keys.gemini);
  } else {
    apiKey = getApiKey(provider, keys);
  }

  if (!apiKey && provider !== 'ping') {
    return res.status(400).json({ error: `API key for ${provider} is missing. Please configure it in your .env file or settings.` });
  }

  try {
    if (provider === 'ping') {
      return res.json({ status: 'ok' });
    }

    if (provider === 'gemini' || provider === 'gemini_personal' || provider === 'gemini_work' || provider === 'gemini_moderator') {
      const geminiContents = messages.map(msg => {
        let role = 'user';
        if (msg.role === 'assistant' || msg.role === 'model' || msg.role === 'agent') {
          role = 'model';
        }
        return {
          role: role,
          parts: [{ text: msg.content }]
        };
      });

      const body = {
        contents: geminiContents,
        generationConfig: {
          temperature: temperature ?? 0.7
        }
      };

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const geminiModel = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after')) || 60;
          throw new Error(`RATE_LIMIT:${retryAfter}`);
        }
        throw new Error(`Gemini API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const usage = {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      };

      return res.json({ reply, usage });

    } else if (provider === 'groq') {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      
      const groqMessages = [];
      if (systemInstruction) {
        groqMessages.push({ role: 'system', content: systemInstruction });
      }
      messages.forEach(msg => {
        const role = msg.role === 'model' || msg.role === 'agent' ? 'assistant' : msg.role;
        groqMessages.push({ role: role, content: msg.content });
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'llama-3.3-70b-versatile',
          messages: groqMessages,
          temperature: temperature ?? 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after')) || 60;
          throw new Error(`RATE_LIMIT:${retryAfter}`);
        }
        throw new Error(`Groq API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '';
      
      const usage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      };

      return res.json({ reply, usage });

    } else if (provider === 'openrouter') {
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      
      const openRouterMessages = [];
      if (systemInstruction) {
        openRouterMessages.push({ role: 'system', content: systemInstruction });
      }
      messages.forEach(msg => {
        const role = msg.role === 'model' || msg.role === 'agent' ? 'assistant' : msg.role;
        openRouterMessages.push({ role: role, content: msg.content });
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Synapse Council'
        },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-3-8b-instruct:free',
          messages: openRouterMessages,
          temperature: temperature ?? 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after')) || 60;
          throw new Error(`RATE_LIMIT:${retryAfter}`);
        }
        throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '';
      
      const usage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      };

      return res.json({ reply, usage });

    } else if (provider === 'cohere') {
      const url = 'https://api.cohere.com/v2/chat';
      
      const cohereMessages = [];
      if (systemInstruction) {
        cohereMessages.push({ role: 'system', content: systemInstruction });
      }
      messages.forEach(msg => {
        const role = msg.role === 'model' || msg.role === 'agent' ? 'assistant' : msg.role;
        cohereMessages.push({ role: role, content: msg.content });
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'command-r-plus',
          messages: cohereMessages,
          temperature: temperature ?? 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after')) || 60;
          throw new Error(`RATE_LIMIT:${retryAfter}`);
        }
        throw new Error(`Cohere API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const reply = data.message?.content?.[0]?.text || data.choices?.[0]?.message?.content || '';
      
      const promptTokens = data.usage?.tokens?.input_tokens || data.meta?.tokens?.input_tokens || 0;
      const completionTokens = data.usage?.tokens?.output_tokens || data.meta?.tokens?.output_tokens || 0;
      
      const usage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      };

      return res.json({ reply, usage });

    } else if (provider === 'deepseek') {
      const url = 'https://api.deepseek.com/chat/completions';
      
      const deepSeekMessages = [];
      if (systemInstruction) {
        deepSeekMessages.push({ role: 'system', content: systemInstruction });
      }
      messages.forEach(msg => {
        const role = msg.role === 'model' || msg.role === 'agent' ? 'assistant' : msg.role;
        deepSeekMessages.push({ role: role, content: msg.content });
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'deepseek-chat',
          messages: deepSeekMessages,
          temperature: temperature ?? 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after')) || 60;
          throw new Error(`RATE_LIMIT:${retryAfter}`);
        }
        throw new Error(`DeepSeek API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '';
      
      const usage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      };

      return res.json({ reply, usage });

    } else if (provider === 'qwen') {
      const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      
      const qwenMessages = [];
      if (systemInstruction) {
        qwenMessages.push({ role: 'system', content: systemInstruction });
      }
      messages.forEach(msg => {
        const role = msg.role === 'model' || msg.role === 'agent' ? 'assistant' : msg.role;
        qwenMessages.push({ role: role, content: msg.content });
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'qwen-plus',
          messages: qwenMessages,
          temperature: temperature ?? 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after')) || 60;
          throw new Error(`RATE_LIMIT:${retryAfter}`);
        }
        throw new Error(`Qwen API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '';
      
      const usage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      };

      return res.json({ reply, usage });

    } else {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

  } catch (error) {
    console.error('API call failed:', error);
    if (error.message.startsWith('RATE_LIMIT:')) {
      const retryAfter = parseInt(error.message.split(':')[1]) || 60;
      return res.status(429).json({ error: 'Rate limit reached', retryAfter });
    }
    return res.status(500).json({ error: error.message || 'An error occurred during the request.' });
  }
});

// POST endpoint to handle semantic compression of debate transcripts
app.post('/api/compress', async (req, res) => {
  const { messages, keys } = req.body;
  
  // Resolve key to run summarization (defaulting to Gemini moderator or personal key)
  const apiKey = process.env.GEMINI_API_KEY_MODERATOR || (keys && keys.gemini_moderator) || process.env.GEMINI_API_KEY_PERSONAL || (keys && keys.gemini_personal) || process.env.GEMINI_API_KEY || (keys && keys.gemini);
  
  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API key is required for semantic compression.' });
  }

  try {
    const rawTranscriptText = messages.map(msg => {
      let roleLabel = 'Observer';
      if (msg.role === 'agent') roleLabel = msg.senderName;
      if (msg.role === 'moderator') roleLabel = 'Council Moderator';
      return `[${roleLabel}]: ${msg.content}`;
    }).join('\n');

    const compressPrompt = `Analyze the following multi-agent debate transcript and compress it using a dense semantic digest method:
1. Map all major logical branches, arguments, and points of agreement.
2. Outline current bottlenecks or dead ends explaining why progress is limited by science, tech, resources, or logic.
3. List each participant and summarize their core arguments in 1-2 bullet points.
4. Keep the summary dense, structured, and free of polite filler. Avoid conversational meta-commentary.
5. Keep it under 250 words total.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${compressPrompt}\n\nTranscript:\n${rawTranscriptText}` }]
        }
      ]
    };

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini summarization failed: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const compressed = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to compress transcript.';
    
    return res.json({ compressed });
  } catch (error) {
    console.error('Compression failed:', error);
    return res.status(500).json({ error: `Compression failed: ${error.message}` });
  }
});

// GET endpoint to list all debate markdown files in the vault
app.get('/api/vault', async (req, res) => {
  try {
    const vaultDir = path.join(__dirname, 'vault');
    if (!fs.existsSync(vaultDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(vaultDir).filter(f => f.endsWith('.md'));
    const fileList = files.map(file => {
      const content = fs.readFileSync(path.join(vaultDir, file), 'utf8');
      
      // Simple regex-based frontmatter parser
      const frontmatter = {};
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        const fmText = fmMatch[1];
        fmText.split('\n').forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
            frontmatter[key] = value;
          }
        });
      }

      return {
        filename: file,
        title: frontmatter.title || file.replace('.md', ''),
        date: frontmatter.date || fs.statSync(path.join(vaultDir, file)).mtime,
        turns: frontmatter['stats.turns'] || frontmatter.turns || 0,
        tokens: frontmatter['stats.total_tokens'] || frontmatter.total_tokens || 0
      };
    });

    // Sort by date descending
    fileList.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.json({ files: fileList });
  } catch (error) {
    console.error('Vault read failed:', error);
    return res.status(500).json({ error: `Failed to read vault: ${error.message}` });
  }
});

// GET endpoint to serve a single vault file content
app.get('/api/vault/:filename', async (req, res) => {
  try {
    const vaultDir = path.join(__dirname, 'vault');
    const filename = path.basename(req.params.filename); // secure basename traversal prevention
    const filePath = path.join(vaultDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return res.json({ content });
  } catch (error) {
    console.error('File read failed:', error);
    return res.status(500).json({ error: `Failed to read file: ${error.message}` });
  }
});

// POST endpoint to handle Obsidian export
app.post('/api/export', async (req, res) => {
  const { topic, messages, stats, compressedDigest } = req.body;
  
  try {
    const vaultDir = path.join(__dirname, 'vault');
    if (!fs.existsSync(vaultDir)) {
      fs.mkdirSync(vaultDir, { recursive: true });
    }
    
    // Clean filename: debate-YYYY-MM-DD-HH-MM-SS.md
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `debate-${dateStr}-${timeStr}.md`;
    const filePath = path.join(vaultDir, filename);
    
    // Generate Obsidian frontmatter
    let content = `---\n`;
    content += `title: "Synapse Council Debate: ${topic.replace(/"/g, '\\"')}"\n`;
    content += `date: ${now.toISOString()}\n`;
    content += `tags:\n`;
    content += `  - synapse-council\n`;
    content += `  - ai-debate\n`;
    content += `stats:\n`;
    content += `  turns: ${stats.turns || 0}\n`;
    content += `  prompt_tokens: ${stats.promptTokens || 0}\n`;
    content += `  completion_tokens: ${stats.completionTokens || 0}\n`;
    content += `  total_tokens: ${stats.totalTokens || 0}\n`;
    content += `---\n\n`;
    
    content += `# Council Discussion: ${topic}\n\n`;
    content += `## Metadata\n`;
    content += `- **Date**: ${now.toLocaleString()}\n`;
    content += `- **Turns**: ${stats.turns || 0}\n`;
    content += `- **Total Tokens**: ${stats.totalTokens || 0} (${stats.promptTokens} prompt, ${stats.completionTokens} completion)\n\n`;
    
    // Add Karpathy-style dense semantic summary at the very top of the vault record
    if (compressedDigest) {
      content += `## 🧠 Dense Semantic Digest\n`;
      content += `> [!IMPORTANT]\n`;
      content += `> **Compressed Debate Logic & Contradictions**\n`;
      content += `> ${compressedDigest.trim().replace(/\n/g, '\n> ')}\n\n---\n\n`;
    }

    content += `## Transcript\n\n`;
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        content += `### 👁️ Observer (User)\n`;
        content += `${msg.content}\n\n---\n\n`;
      } else if (msg.role === 'moderator') {
        content += `### 📜 Council Moderator\n`;
        content += `> [!WARNING]\n`;
        content += `> **Moderator Directive & Evaluation**\n`;
        content += `> ${msg.content.replace(/\n/g, '\n> ')}\n\n---\n\n`;
      } else {
        const name = msg.senderName || 'AI Agent';
        const model = msg.modelTag || 'Unknown Model';
        content += `### ${name} (${model})\n`;
        content += `${msg.content}\n\n---\n\n`;
      }
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Debate exported successfully to: ${filePath}`);
    
    return res.json({ success: true, filePath, filename });
  } catch (error) {
    console.error('Export failed:', error);
    return res.status(500).json({ error: `Failed to export debate: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Synapse Council server running on http://localhost:${PORT}`);
});
