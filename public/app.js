// Model definitions for each provider
const PROVIDER_MODELS = {
  gemini_personal: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
  ],
  gemini_work: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
  ],
  gemini_moderator: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
  ],
  openrouter: [
    { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B Instruct (Free)' },
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B IT (Free)' },
    { id: 'qwen/qwen-2.5-7b-instruct:free', name: 'Qwen 2.5 7B Instruct (Free)' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Paid/Cheap)' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 Reasoning (Free/Ad)' }
  ],
  cohere: [
    { id: 'command-r-plus', name: 'Command R+ (Trial Key)' },
    { id: 'command-r', name: 'Command R (Trial Key)' }
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3 (deepseek-chat)' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1 (deepseek-reasoner)' }
  ],
  qwen: [
    { id: 'qwen-plus', name: 'Qwen Plus (DashScope)' },
    { id: 'qwen-max', name: 'Qwen Max (DashScope)' },
    { id: 'qwen-turbo', name: 'Qwen Turbo (DashScope)' }
  ]
};

// Default agents loaded on first startup
const DEFAULT_AGENTS = [
  {
    id: 'socrates',
    name: 'Socrates',
    provider: 'openrouter',
    model: 'meta-llama/llama-3-8b-instruct:free',
    color: '#00f2fe',
    avatar: '⚖️',
    systemInstruction: 'You are Socrates, the classical Greek philosopher. You respond in a Socratic manner: asking deep, probing questions, exposing unstated assumptions, and testing definitions. Speak with humility, curiosity, and slight irony. Keep your replies concise and conversational.',
    temperature: 0.8,
    active: true
  },
  {
    id: 'lovelace',
    name: 'Ada Lovelace',
    provider: 'gemini_personal',
    model: 'gemini-2.5-flash',
    color: '#9d4edd',
    avatar: '🧠',
    systemInstruction: 'You are Ada Lovelace, the mathematical pioneer. You analyze all topics through a highly logical, analytical, and structural lens. You view concepts as components of a grand computational engine governed by mathematical rules, code, and relational logic. You are precise, articulate, and highly intellectual. Keep your replies concise.',
    temperature: 0.7,
    active: true
  },
  {
    id: 'catalyst',
    name: 'The Catalyst',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    color: '#ff5e62',
    avatar: '🔥',
    systemInstruction: 'You are The Catalyst. Your focus is on radical ideas, paradigm shifts, scientific progress, and bold speculations. You encourage thinking outside established norms, challenge intellectual safety, and offer creative, high-energy perspectives. Keep your replies concise and highly stimulating.',
    temperature: 0.9,
    active: true
  }
];

// App State
let agents = [];
let messages = [];
let localKeys = {};
let isDiscussionRunning = false;
let currentTurnIndex = 0;
let totalTurnsRequested = 5;
let turnTimer = null;
let lastActiveAgentId = null;

// Cumulative Token Statistics
let totalPromptTokens = 0;
let totalCompletionTokens = 0;
let totalTurns = 0;

// Rate-limit Cooldown State (seconds remaining)
let providerCooldowns = {
  gemini_personal: 0,
  gemini_work: 0,
  gemini_moderator: 0,
  groq: 0,
  openrouter: 0,
  cohere: 0,
  deepseek: 0,
  qwen: 0
};

// DOM Elements
const providerSelect = document.getElementById('agent-provider');
const modelSelect = document.getElementById('agent-model');
const tempInput = document.getElementById('agent-temp');
const tempVal = document.getElementById('agent-temp-val');
const agentForm = document.getElementById('agent-creator-form');
const councilList = document.getElementById('council-list');
const councilCount = document.getElementById('council-count');
const chatStream = document.getElementById('chat-stream');
const debateTopicInput = document.getElementById('debate-topic');
const autonomousTurnsSelect = document.getElementById('autonomous-turns');
const autonomousToggle = document.getElementById('autonomous-toggle');
const startDiscussionBtn = document.getElementById('start-discussion-btn');
const pauseBtn = document.getElementById('pause-btn');
const stepBtn = document.getElementById('step-btn');
const clearArenaBtn = document.getElementById('clear-arena-btn');
const userMessageInput = document.getElementById('user-message-input');
const targetAgentSelect = document.getElementById('target-agent-select');
const sendUserBtn = document.getElementById('send-user-btn');
const saveKeysBtn = document.getElementById('save-keys-btn');
const serverStatusText = document.getElementById('server-status-text');
const statusPulse = document.querySelector('.status-pulse');

// Advanced Controls DOM Elements
const historyLimitSelect = document.getElementById('history-limit');
const moderatorToggle = document.getElementById('moderator-toggle');
const moderatorIntervalSelect = document.getElementById('moderator-interval');
const exportObsidianBtn = document.getElementById('export-obsidian-btn');
const userInputPanel = document.querySelector('.user-input-panel');

// Navigation Tabs
const tabArena = document.getElementById('tab-arena');
const tabVault = document.getElementById('tab-vault');
const vaultPanel = document.getElementById('vault-panel');
const sidebar = document.querySelector('.sidebar');
const chatArena = document.querySelector('.chat-arena');

// Vault Viewer DOM Elements
const refreshVaultBtn = document.getElementById('refresh-vault-btn');
const vaultFileList = document.getElementById('vault-file-list');
const vaultDocTitle = document.getElementById('vault-doc-title');
const vaultDocMeta = document.getElementById('vault-doc-meta');
const vaultDocContent = document.getElementById('vault-doc-content');

// Stats DOM Elements
const statsPrompt = document.getElementById('stats-prompt');
const statsCompletion = document.getElementById('stats-completion');
const statsTotal = document.getElementById('stats-total');
const statsTurns = document.getElementById('stats-turns');
const cooldownsList = document.getElementById('cooldowns-list');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadKeys();
  loadAgents();
  setupEventListeners();
  updateModelOptions();
  renderCouncil();
  checkServerConnection();
  updateStatsUI();
  initCooldownTicker();
});

// Event Listeners Setup
function setupEventListeners() {
  providerSelect.addEventListener('change', updateModelOptions);
  
  tempInput.addEventListener('input', (e) => {
    tempVal.textContent = e.target.value;
  });

  agentForm.addEventListener('submit', handleAgentCreation);
  saveKeysBtn.addEventListener('click', saveKeysFromUI);

  startDiscussionBtn.addEventListener('click', startDiscussion);
  pauseBtn.addEventListener('click', pauseDiscussion);
  stepBtn.addEventListener('click', stepTurn);
  clearArenaBtn.addEventListener('click', clearArena);
  exportObsidianBtn.addEventListener('click', exportDebateToObsidian);

  sendUserBtn.addEventListener('click', sendUserMessage);
  userMessageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });

  // Tab selections
  tabArena.addEventListener('click', () => switchTab('arena'));
  tabVault.addEventListener('click', () => switchTab('vault'));
  refreshVaultBtn.addEventListener('click', loadVaultList);

  // Collapsible panels
  document.querySelectorAll('.panel.collapsible').forEach(panel => {
    const toggleBtn = panel.querySelector('.toggle-panel-btn');
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
    });
  });
}

// Tab switcher
function switchTab(tab) {
  if (tab === 'arena') {
    tabArena.className = 'tab-btn active';
    tabVault.className = 'tab-btn';
    sidebar.style.display = 'flex';
    chatArena.style.display = 'flex';
    vaultPanel.classList.add('hidden');
  } else {
    tabVault.className = 'tab-btn active';
    tabArena.className = 'tab-btn';
    sidebar.style.display = 'none';
    chatArena.style.display = 'none';
    vaultPanel.classList.remove('hidden');
    loadVaultList();
  }
}

// Check if Express backend is running
async function checkServerConnection() {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'ping', keys: {} })
    });
    statusPulse.className = 'status-pulse connected';
    serverStatusText.textContent = 'Proxy server connected';
  } catch (err) {
    console.warn('Backend proxy offline or ping failed.', err);
    statusPulse.className = 'status-pulse error';
    serverStatusText.textContent = 'Proxy offline (Using local proxies)';
  }
}

// Cooldown Countdown Ticker (1 second interval)
function initCooldownTicker() {
  setInterval(() => {
    let changed = false;
    for (const provider of Object.keys(providerCooldowns)) {
      if (providerCooldowns[provider] > 0) {
        providerCooldowns[provider]--;
        changed = true;
      }
    }
    if (changed) {
      updateCooldownsUI();
    }
  }, 1000);
}

// Render active rate limits
function updateCooldownsUI() {
  cooldownsList.innerHTML = '';
  for (const [provider, time] of Object.entries(providerCooldowns)) {
    if (time > 0) {
      const item = document.createElement('div');
      item.className = 'cooldown-item';
      
      let friendlyProvider = provider;
      if (provider === 'gemini_personal') friendlyProvider = 'Gemini (Pers)';
      if (provider === 'gemini_work') friendlyProvider = 'Gemini (Work)';
      if (provider === 'gemini_moderator') friendlyProvider = 'Gemini (Mod)';
      
      item.innerHTML = `
        <span class="cooldown-label">⚠️ ${friendlyProvider} Locked</span>
        <span class="cooldown-timer">Retry in ${time}s</span>
      `;
      cooldownsList.appendChild(item);
    }
  }
}

// Local Storage Keys Manager
function loadKeys() {
  const savedKeys = localStorage.getItem('synapse_keys');
  if (savedKeys) {
    localKeys = JSON.parse(savedKeys);
    document.getElementById('key-gemini-personal').value = localKeys.gemini_personal || '';
    document.getElementById('key-gemini-work').value = localKeys.gemini_work || '';
    document.getElementById('key-gemini-moderator').value = localKeys.gemini_moderator || '';
    document.getElementById('key-groq').value = localKeys.groq || '';
    document.getElementById('key-openrouter').value = localKeys.openrouter || '';
    document.getElementById('key-cohere').value = localKeys.cohere || '';
    document.getElementById('key-deepseek').value = localKeys.deepseek || '';
    document.getElementById('key-qwen').value = localKeys.qwen || '';
  }
}

function saveKeysFromUI() {
  localKeys = {
    gemini_personal: document.getElementById('key-gemini-personal').value.trim(),
    gemini_work: document.getElementById('key-gemini-work').value.trim(),
    gemini_moderator: document.getElementById('key-gemini-moderator').value.trim(),
    groq: document.getElementById('key-groq').value.trim(),
    openrouter: document.getElementById('key-openrouter').value.trim(),
    cohere: document.getElementById('key-cohere').value.trim(),
    deepseek: document.getElementById('key-deepseek').value.trim(),
    qwen: document.getElementById('key-qwen').value.trim()
  };
  localStorage.setItem('synapse_keys', JSON.stringify(localKeys));
  showFloatingNotification('Local API keys updated!');
}

// Local Storage Agents Manager
function loadAgents() {
  const savedAgents = localStorage.getItem('synapse_agents');
  if (savedAgents) {
    agents = JSON.parse(savedAgents);
  } else {
    agents = [...DEFAULT_AGENTS];
    localStorage.setItem('synapse_agents', JSON.stringify(agents));
  }
}

function saveAgents() {
  localStorage.setItem('synapse_agents', JSON.stringify(agents));
}

// Update model choices based on selected provider
function updateModelOptions() {
  const provider = providerSelect.value;
  const models = PROVIDER_MODELS[provider] || [];
  modelSelect.innerHTML = '';
  
  models.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model.id;
    opt.textContent = model.name;
    modelSelect.appendChild(opt);
  });
}

// Handle Custom Agent Creation
function handleAgentCreation(e) {
  e.preventDefault();
  
  const id = 'agent_' + Date.now();
  const name = document.getElementById('agent-name').value.trim();
  const provider = providerSelect.value;
  const model = modelSelect.value;
  const color = document.getElementById('agent-color').value;
  const avatar = document.getElementById('agent-avatar').value;
  const systemInstruction = document.getElementById('agent-system').value.trim();
  const temperature = parseFloat(tempInput.value);

  const newAgent = {
    id,
    name,
    provider,
    model,
    color,
    avatar,
    systemInstruction,
    temperature,
    active: true
  };

  const existingIndex = agents.findIndex(a => a.name.toLowerCase() === name.toLowerCase());
  if (existingIndex !== -1) {
    agents[existingIndex] = { ...agents[existingIndex], ...newAgent, id: agents[existingIndex].id };
    showFloatingNotification(`Updated agent "${name}"`);
  } else {
    agents.push(newAgent);
    showFloatingNotification(`Created agent "${name}"`);
  }

  saveAgents();
  renderCouncil();
  agentForm.reset();
  updateModelOptions();
  tempVal.textContent = '0.7';
}

// Render active council cards and target selectors
function renderCouncil() {
  councilList.innerHTML = '';
  const activeCouncilMembers = agents.filter(a => a.active);
  councilCount.textContent = activeCouncilMembers.length;

  if (agents.length === 0) {
    councilList.innerHTML = `<div class="empty-state">No agents created yet. Add agents above to seat them in the Council.</div>`;
    return;
  }

  agents.forEach(agent => {
    const card = document.createElement('div');
    card.className = `council-card ${agent.active ? 'active' : 'inactive'}`;
    card.style.setProperty('--agent-color', agent.color);
    
    let displayProvider = agent.provider;
    if (agent.provider === 'gemini_personal') displayProvider = 'Gemini (Pers)';
    if (agent.provider === 'gemini_work') displayProvider = 'Gemini (Work)';

    card.innerHTML = `
      <div class="council-card-left">
        <div class="avatar-badge" style="box-shadow: inset 0 0 10px ${agent.color}44, 0 0 8px ${agent.color}22">
          ${agent.avatar}
        </div>
        <div class="agent-meta-info">
          <h4>${agent.name}</h4>
          <p>${displayProvider} • ${agent.model.split('/').pop()}</p>
        </div>
      </div>
      <div class="agent-actions">
        <label class="switch-container" title="Seat in Council">
          <input type="checkbox" class="agent-toggle" data-id="${agent.id}" ${agent.active ? 'checked' : ''}>
          <span class="switch-slider"></span>
        </label>
        <button class="icon-btn delete-agent-btn" data-id="${agent.id}" title="Remove Agent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;

    card.querySelector('.agent-toggle').addEventListener('change', (e) => {
      agent.active = e.target.checked;
      saveAgents();
      renderCouncil();
    });

    card.querySelector('.delete-agent-btn').addEventListener('click', () => {
      agents = agents.filter(a => a.id !== agent.id);
      saveAgents();
      renderCouncil();
      showFloatingNotification(`Removed agent "${agent.name}"`);
    });

    councilList.appendChild(card);
  });

  const oldTargetValue = targetAgentSelect.value;
  targetAgentSelect.innerHTML = `<option value="all">Address Entire Council</option>`;
  activeCouncilMembers.forEach(agent => {
    const opt = document.createElement('option');
    opt.value = agent.id;
    opt.textContent = `Direct to: ${agent.name}`;
    targetAgentSelect.appendChild(opt);
  });
  if ([...targetAgentSelect.options].some(o => o.value === oldTargetValue)) {
    targetAgentSelect.value = oldTargetValue;
  }
}

// Markdown Parser Helper (handles tables and lists)
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const lines = code.trim().split('\n');
    let lang = '';
    if (lines[0].length < 15 && !lines[0].includes(' ') && lines[0].length > 0) {
      lang = lines.shift();
    }
    return `<pre><code class="language-${lang}">${lines.join('\n')}</code></pre>`;
  });

  // Inline Code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Tables parsing scan:
  const lines = html.split('\n');
  let inTable = false;
  let tblRows = [];
  let finalHtml = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      const cols = line.split('|').slice(1, -1).map(c => c.trim());
      // Skip separator rows
      if (cols.every(c => c.startsWith('-'))) continue;
      tblRows.push(cols);
    } else {
      if (inTable) {
        let tableHtml = '<table>';
        tblRows.forEach((row, rIdx) => {
          tableHtml += '<tr>';
          row.forEach(col => {
            if (rIdx === 0) {
              tableHtml += `<th>${col}</th>`;
            } else {
              tableHtml += `<td>${col}</td>`;
            }
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</table>';
        finalHtml.push(tableHtml);
        tblRows = [];
        inTable = false;
      }
      finalHtml.push(lines[i]);
    }
  }
  if (inTable) {
    let tableHtml = '<table>';
    tblRows.forEach((row, rIdx) => {
      tableHtml += '<tr>';
      row.forEach(col => {
        if (rIdx === 0) {
          tableHtml += `<th>${col}</th>`;
        } else {
          tableHtml += `<td>${col}</td>`;
        }
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</table>';
    finalHtml.push(tableHtml);
  }

  html = finalHtml.join('\n');

  // Paragraphs
  const paragraphs = html.split('\n\n');
  html = paragraphs.map(p => {
    if (p.trim().startsWith('&lt;pre&gt;') || p.trim().startsWith('<pre>') || p.trim().startsWith('<ul>') || p.trim().startsWith('<li>') || p.trim().startsWith('<table>')) {
      return p;
    }
    if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
      const items = p.trim().split(/\n[-*] /);
      const listItems = items.map((item, idx) => {
        let clean = item;
        if (idx === 0) clean = item.replace(/^[-*] /, '');
        return `<li>${clean}</li>`;
      }).join('');
      return `<ul>${listItems}</ul>`;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

// Extract and parse DeepSeek <think> blocks
function parseReasoning(content) {
  let reasoning = '';
  let mainBody = content;

  const thinkRegex = /&lt;think&gt;([\s\S]*?)&lt;\/think&gt;|<think>([\s\S]*?)<\/think>/i;
  const match = content.match(thinkRegex);
  
  if (match) {
    reasoning = (match[1] || match[2] || '').trim();
    mainBody = content.replace(thinkRegex, '').trim();
  }

  return { reasoning, mainBody };
}

// Append messages to the chat screen
function appendMessage(senderName, avatar, color, content, isUser = false, modelTag = '', isModerator = false) {
  const welcome = chatStream.querySelector('.welcome-screen');
  if (welcome) welcome.remove();

  const card = document.createElement('div');
  card.className = `message-card ${isUser ? 'user-msg' : ''} ${isModerator ? 'moderator-msg' : ''}`;
  card.style.setProperty('--agent-color', color);

  const { reasoning, mainBody } = parseReasoning(content);
  const formattedContent = parseMarkdown(mainBody);
  const formattedReasoning = parseMarkdown(reasoning);

  let thoughtHtml = '';
  if (reasoning) {
    thoughtHtml = `
      <div class="thought-block">
        <div class="thought-header">
          <span>🧠 Thought Process (Reasoning Tracing)</span>
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" width="12" height="12">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="thought-body">${formattedReasoning}</div>
      </div>
    `;
  }

  const modelBadge = modelTag ? `<span class="message-model-tag">${modelTag}</span>` : '';

  card.innerHTML = `
    <div class="message-header">
      <div class="message-agent-meta">
        <span class="message-avatar">${avatar}</span>
        <span class="message-name" style="color: ${color}">${senderName}</span>
        ${modelBadge}
      </div>
      <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    ${thoughtHtml}
    <div class="message-content">${formattedContent}</div>
  `;

  if (reasoning) {
    const header = card.querySelector('.thought-header');
    const thoughtBlock = card.querySelector('.thought-block');
    header.addEventListener('click', () => {
      thoughtBlock.classList.toggle('collapsed');
      const icon = header.querySelector('svg');
      if (thoughtBlock.classList.contains('collapsed')) {
        icon.style.transform = 'rotate(-90deg)';
      } else {
        icon.style.transform = 'rotate(0deg)';
      }
    });
  }

  chatStream.appendChild(card);
  chatStream.scrollTop = chatStream.scrollHeight;

  // Toggle Obsidian export button visibility if messages exist
  if (messages.length > 0) {
    exportObsidianBtn.style.display = 'inline-flex';
  }
}

// Render typing indicator
function showSynthesizingIndicator(agent) {
  removeSynthesizingIndicator();

  const card = document.createElement('div');
  card.className = 'message-card synthesizing-card';
  card.id = 'synthesizing-indicator';
  card.style.setProperty('--agent-color', agent.color);

  card.innerHTML = `
    <div class="synthesizing-content">
      <span class="message-avatar">${agent.avatar}</span>
      <strong style="color: ${agent.color}">${agent.name}</strong> 
      <span>is synthesizing thoughts...</span>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  chatStream.appendChild(card);
  chatStream.scrollTop = chatStream.scrollHeight;
}

function removeSynthesizingIndicator() {
  const indicator = document.getElementById('synthesizing-indicator');
  if (indicator) indicator.remove();
}

// Stats UI Refresh Helper
function updateStatsUI() {
  statsPrompt.textContent = totalPromptTokens.toLocaleString();
  statsCompletion.textContent = totalCompletionTokens.toLocaleString();
  statsTotal.textContent = (totalPromptTokens + totalCompletionTokens).toLocaleString();
  statsTurns.textContent = totalTurns.toLocaleString();
}

// Build the custom prompt context containing conversation transcripts
// Supports Context Compaction (Token Saver)
function compileConversationContext(targetAgent) {
  const coreInstruction = `You are participating in a panel/council debate. The chat logs contain messages prefixed by speaker names like "[Speaker Name]: message". Avoid repeating your own name. Respond directly to the discussion, referencing points made by other members when applicable.\n\n[GUARDRAIL]: Keep your response extremely focused, analytical, and under 150 words. Check arguments for consistency and directly point out logical fallacies in peer remarks.`;
  
  const activeAgentSystemPrompt = `${targetAgent.systemInstruction}\n\n${coreInstruction}`;
  
  // Compact history using the sliding window limit
  const limit = parseInt(historyLimitSelect.value) || 999;
  let targetMessages = [];
  
  if (messages.length <= limit) {
    targetMessages = [...messages];
  } else {
    // Keep starting topic directive (index 0) to maintain conversational anchoring
    targetMessages.push(messages[0]);
    // Extract last N messages
    const sliced = messages.slice(-limit);
    targetMessages.push(...sliced);
  }

  const compiledHistory = [];
  targetMessages.forEach(msg => {
    if (msg.role === 'user') {
      compiledHistory.push({
        role: 'user',
        content: `[User]: ${msg.content}`
      });
    } else if (msg.role === 'moderator') {
      compiledHistory.push({
        role: 'user',
        content: `[Council Moderator Intervention]: ${msg.content}`
      });
    } else if (msg.role === 'agent') {
      if (msg.agentId === targetAgent.id) {
        compiledHistory.push({
          role: 'model',
          content: msg.content
        });
      } else {
        compiledHistory.push({
          role: 'user',
          content: `[${msg.senderName}]: ${msg.content}`
        });
      }
    }
  });

  return {
    systemInstruction: activeAgentSystemPrompt,
    messages: compiledHistory
  };
}

// Call API proxy on the Express server
async function callAgentAPI(agent, context) {
  const payload = {
    provider: agent.provider,
    model: agent.model,
    messages: context.messages,
    systemInstruction: context.systemInstruction,
    temperature: agent.temperature,
    keys: localKeys
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 429) {
    const errorData = await response.json();
    const retryAfter = errorData.retryAfter || 60;
    // Set cooldown in state
    providerCooldowns[agent.provider] = retryAfter;
    updateCooldownsUI();
    throw new Error(`RATE_LIMIT:${retryAfter}`);
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  const data = await response.json();

  if (data.usage) {
    totalPromptTokens += data.usage.promptTokens || 0;
    totalCompletionTokens += data.usage.completionTokens || 0;
  }
  totalTurns++;
  updateStatsUI();

  return data.reply;
}

// Summon the Gemini Moderator to prevent drift and critique argument quality
async function runModeratorIntervention() {
  const moderatorAgent = {
    provider: 'gemini_moderator',
    model: 'gemini-2.5-flash',
    name: 'Council Moderator',
    avatar: '📜',
    color: '#ffb703',
    temperature: 0.4
  };

  showSynthesizingIndicator(moderatorAgent);

  const moderatorSystemInstruction = `You are the Council Moderator, an objective, highly analytical observer of the current panel discussion. 
Your task is to analyze the debate transcript relative to the starting topic:
1. Steer the agents to reach a conclusion or map out "dead ends" explaining why progress is limited by science, tech, knowledge, or resources.
2. Evaluate the argument quality of each active agent in their last response. Output an Elocution Scorecard as a Markdown Table with columns: Agent, Logic (1-10), Evidence (1-10), Verbiage (1-10), and a brief critique.
3. Suggest 1-2 improved prompt guardrails to help the agents elevate their eloquence and verbiage.
4. Keep your remarks under 120 words total. Speak with intellectual authority and maintain strict objectivity.`;

  // Always pass full history to moderator so they can see the whole arc
  const compiledHistory = [];
  messages.forEach(msg => {
    if (msg.role === 'user') {
      compiledHistory.push({ role: 'user', content: `[User]: ${msg.content}` });
    } else if (msg.role === 'moderator') {
      compiledHistory.push({ role: 'model', content: msg.content });
    } else if (msg.role === 'agent') {
      compiledHistory.push({ role: 'user', content: `[${msg.senderName}]: ${msg.content}` });
    }
  });

  try {
    const context = {
      systemInstruction: moderatorSystemInstruction,
      messages: compiledHistory
    };
    
    const reply = await callAgentAPI(moderatorAgent, context);
    removeSynthesizingIndicator();

    appendMessage('Council Moderator', '📜', '#ffb703', reply, false, 'Gemini Moderator', true);
    
    messages.push({
      role: 'moderator',
      content: reply
    });

  } catch (error) {
    removeSynthesizingIndicator();
    if (error.message.startsWith('RATE_LIMIT:')) {
      showFloatingNotification('Moderator skipped: Gemini is rate-limited.', 'error');
    } else {
      console.error('Moderator failed:', error);
      showFloatingNotification(`Moderator error: ${error.message}`, 'error');
    }
  }
}

// Run next active agent in sequence
async function runNextAgentTurn() {
  const activeAgents = agents.filter(a => a.active);
  
  if (activeAgents.length === 0) {
    showFloatingNotification('No active debaters selected!', 'error');
    stopDiscussionState();
    return;
  }

  // Choose next index in sequence
  let nextIndex = 0;
  if (lastActiveAgentId) {
    const lastIdx = activeAgents.findIndex(x => x.id === lastActiveAgentId);
    if (lastIdx !== -1) {
      nextIndex = (lastIdx + 1) % activeAgents.length;
    }
  }
  
  const currentActor = activeAgents[nextIndex];

  // Check if provider is on cooldown
  if (providerCooldowns[currentActor.provider] > 0) {
    showFloatingNotification(`Skipping ${currentActor.name} (${friendlyProviderName(currentActor.provider)} rate-limited)`, 'error');
    lastActiveAgentId = currentActor.id;
    if (isDiscussionRunning) {
      turnTimer = setTimeout(runNextAgentTurn, 1000);
    }
    return;
  }

  // Check if it is time for a Moderator intervention
  const isModEnabled = moderatorToggle.checked;
  const modInterval = parseInt(moderatorIntervalSelect.value);
  if (isModEnabled && totalTurns > 0 && totalTurns % modInterval === 0 && messages[messages.length-1].role !== 'moderator') {
    await runModeratorIntervention();
  }

  lastActiveAgentId = currentActor.id;
  showSynthesizingIndicator(currentActor);

  try {
    const context = compileConversationContext(currentActor);
    const reply = await callAgentAPI(currentActor, context);
    
    removeSynthesizingIndicator();
    
    appendMessage(currentActor.name, currentActor.avatar, currentActor.color, reply, false, currentActor.model.split('/').pop());
    
    messages.push({
      role: 'agent',
      agentId: currentActor.id,
      senderName: currentActor.name,
      modelTag: currentActor.model.split('/').pop(),
      content: reply
    });

    currentTurnIndex++;

    if (isDiscussionRunning && currentTurnIndex < totalTurnsRequested) {
      turnTimer = setTimeout(runNextAgentTurn, 1000);
    } else {
      stopDiscussionState();
    }

  } catch (error) {
    removeSynthesizingIndicator();
    
    if (error.message.startsWith('RATE_LIMIT:')) {
      const waitTime = error.message.split(':')[1];
      showFloatingNotification(`${currentActor.name} rate-limited! Provider locked for ${waitTime}s.`, 'error');
      if (isDiscussionRunning) {
        turnTimer = setTimeout(runNextAgentTurn, 5000);
      } else {
        stopDiscussionState();
      }
    } else {
      showFloatingNotification(`Error calling ${currentActor.name}: ${error.message}`, 'error');
      appendMessage('System Error', '⚠️', '#ff5e62', `Failed to get response from agent **${currentActor.name}** (${currentActor.provider}).\n\n*Error details:* ${error.message}`);
      stopDiscussionState();
    }
  }
}

// Friendly name resolver helper
function friendlyProviderName(provider) {
  if (provider === 'gemini_personal') return 'Gemini (Pers)';
  if (provider === 'gemini_work') return 'Gemini (Work)';
  if (provider === 'gemini_moderator') return 'Gemini (Mod)';
  return provider;
}

// Initiation & Control Logic
function startDiscussion() {
  const topic = debateTopicInput.value.trim();
  const activeAgents = agents.filter(a => a.active);

  if (activeAgents.length === 0) {
    showFloatingNotification('Please select active agents.', 'error');
    return;
  }

  if (topic.length === 0 && messages.length === 0) {
    showFloatingNotification('Please enter a discussion topic or initial prompt.', 'error');
    return;
  }

  if (topic.length > 0 && messages.length === 0) {
    appendMessage('Council Directive', '📜', '#ffb703', `Initiated discussion topic: **"${topic}"**`);
    messages.push({
      role: 'user',
      content: `The starting discussion topic is: "${topic}". Please share your perspective on this, building on previous arguments if any.`
    });
    debateTopicInput.value = '';
  }

  const isAutonomous = autonomousToggle.checked;
  
  if (isAutonomous) {
    totalTurnsRequested = parseInt(autonomousTurnsSelect.value);
    currentTurnIndex = 0;
    isDiscussionRunning = true;
    
    startDiscussionBtn.classList.add('hidden');
    stepBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    
    runNextAgentTurn();
  } else {
    stepTurn();
  }
}

function pauseDiscussion() {
  isDiscussionRunning = false;
  if (turnTimer) clearTimeout(turnTimer);
  stopDiscussionState();
  showFloatingNotification('Council paused.');
}

function stopDiscussionState() {
  isDiscussionRunning = false;
  startDiscussionBtn.classList.remove('hidden');
  stepBtn.classList.remove('hidden');
  pauseBtn.classList.add('hidden');
  userInputPanel.classList.remove('active-turn');
}

function stepTurn() {
  const activeAgents = agents.filter(a => a.active);
  if (activeAgents.length === 0) {
    showFloatingNotification('No active debaters selected!', 'error');
    return;
  }

  const topic = debateTopicInput.value.trim();
  if (topic.length > 0 && messages.length === 0) {
    appendMessage('Council Directive', '📜', '#ffb703', `Initiated discussion topic: **"${topic}"**`);
    messages.push({
      role: 'user',
      content: `The starting discussion topic is: "${topic}". Please share your perspective on this.`
    });
    debateTopicInput.value = '';
  }

  runNextAgentTurn();
}

function clearArena() {
  if (turnTimer) clearTimeout(turnTimer);
  stopDiscussionState();
  messages = [];
  lastActiveAgentId = null;
  currentTurnIndex = 0;
  
  totalPromptTokens = 0;
  totalCompletionTokens = 0;
  totalTurns = 0;
  updateStatsUI();

  for (const provider of Object.keys(providerCooldowns)) {
    providerCooldowns[provider] = 0;
  }
  updateCooldownsUI();

  exportObsidianBtn.style.display = 'none';
  chatStream.innerHTML = '';
  
  const welcome = document.createElement('div');
  welcome.className = 'welcome-screen';
  welcome.innerHTML = `
    <h2>Welcome to the Synapse Council</h2>
    <p>A playground to facilitate dialogue between different forms of artificial intelligence. Seat multiple LLMs at the table, define their individual perspectives, and watch them collaborate, argue, or analyze any topic.</p>
    <div class="setup-steps">
      <div class="step-card">
        <div class="step-num">1</div>
        <h4>Provide API Keys</h4>
        <p>Add key values in your local `.env` or paste them in the sidebar configuration drawer.</p>
      </div>
      <div class="step-card">
        <div class="step-num">2</div>
        <h4>Configure Agents</h4>
        <p>Create agents representing different personas and models, and add them to the Council.</p>
      </div>
      <div class="step-card">
        <div class="step-num">3</div>
        <h4>Start the Debate</h4>
        <p>Type a topic or question, configure autonomous turns, and click <strong>Initiate Council</strong>.</p>
      </div>
    </div>
  `;
  chatStream.appendChild(welcome);
  showFloatingNotification('Arena cleared!');
}

// User send direct messages / turn replies
async function sendUserMessage() {
  const text = userMessageInput.value.trim();
  if (text.length === 0) return;

  const target = targetAgentSelect.value;
  userMessageInput.value = '';

  // Render user message card
  appendMessage('You (Observer)', '👁️‍🗨️', '#00f2fe', text, true);

  if (target === 'all') {
    messages.push({
      role: 'user',
      content: text
    });
    
    if (isDiscussionRunning) {
      // If discussion is already active, let it continue
    } else if (autonomousToggle.checked) {
      startDiscussion();
    } else {
      stepTurn();
    }
  } else {
    // Addressing a specific agent
    const targetAgent = agents.find(a => a.id === target);
    if (!targetAgent) return;

    messages.push({
      role: 'user',
      content: `[To ${targetAgent.name}]: ${text}`
    });

    showSynthesizingIndicator(targetAgent);
    
    try {
      const context = compileConversationContext(targetAgent);
      const reply = await callAgentAPI(targetAgent, context);
      removeSynthesizingIndicator();
      
      appendMessage(targetAgent.name, targetAgent.avatar, targetAgent.color, reply, false, targetAgent.model.split('/').pop());
      
      messages.push({
        role: 'agent',
        agentId: targetAgent.id,
        senderName: targetAgent.name,
        modelTag: targetAgent.model.split('/').pop(),
        content: reply
      });
      
      lastActiveAgentId = targetAgent.id;
    } catch (error) {
      removeSynthesizingIndicator();
      showFloatingNotification(`Error: ${error.message}`, 'error');
      appendMessage('System Error', '⚠️', '#ff5e62', `Failed to get response from **${targetAgent.name}**.\n\n*Error:* ${error.message}`);
    }
  }
}

// Export Transcript to Obsidian Vault with Semantic Compression
async function exportDebateToObsidian() {
  if (messages.length === 0) {
    showFloatingNotification('No messages to export.', 'error');
    return;
  }

  showFloatingNotification('Running Karpathy semantic compression...', 'info');

  let topic = "General Discussion";
  if (messages[0].role === 'user' && messages[0].content.includes('starting discussion topic is:')) {
    const match = messages[0].content.match(/"([^"]+)"/);
    if (match) topic = match[1];
  }

  // 1. Fetch dense semantic compression from server
  let compressedDigest = "";
  try {
    const compRes = await fetch('/api/compress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, keys: localKeys })
    });
    
    if (compRes.ok) {
      const compData = await compRes.json();
      compressedDigest = compData.compressed;
    }
  } catch (err) {
    console.warn("Semantic compression failed, writing raw file...", err);
  }

  // 2. Post export request to server
  const payload = {
    topic: topic,
    messages: messages,
    stats: {
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      turns: totalTurns
    },
    compressedDigest: compressedDigest
  };

  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Server failed to write file.');
    }

    const data = await response.json();
    showFloatingNotification(`Vault record created: ${data.filename}`);
  } catch (error) {
    console.error('Export failed:', error);
    showFloatingNotification(`Export failed: ${error.message}`, 'error');
  }
}

// ==========================================
// KNOWLEDGE BANK VIEWER FUNCTIONS
// ==========================================

async function loadVaultList() {
  try {
    const res = await fetch('/api/vault');
    if (!res.ok) throw new Error('Failed to fetch vault');
    const data = await res.json();
    
    vaultFileList.innerHTML = '';
    if (data.files.length === 0) {
      vaultFileList.innerHTML = `<div class="empty-state">No exported debates found. Click "Export to Obsidian" in Arena mode to create a record.</div>`;
      return;
    }
    
    data.files.forEach(file => {
      const card = document.createElement('div');
      card.className = 'vault-file-card';
      card.dataset.filename = file.filename;
      
      const dateStr = new Date(file.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      card.innerHTML = `
        <h4>${file.title}</h4>
        <div class="vault-file-meta">
          <span class="vault-file-date">${dateStr}</span>
          <span class="vault-file-stats">${file.turns} Turns • ${file.tokens.toLocaleString()} Tkn</span>
        </div>
      `;
      
      card.addEventListener('click', () => {
        document.querySelectorAll('.vault-file-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        loadVaultFile(file.filename);
      });
      
      vaultFileList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    showFloatingNotification('Failed to load vault list', 'error');
  }
}

async function loadVaultFile(filename) {
  try {
    vaultDocContent.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">Loading document...</div>`;
    const res = await fetch(`/api/vault/${filename}`);
    if (!res.ok) throw new Error('Failed to load file');
    const data = await res.json();
    
    // Parse frontmatter metadata
    let title = filename.replace('.md', '');
    let stats = '';
    
    const fmMatch = data.content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fmText = fmMatch[1];
      const frontmatter = {};
      fmText.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          frontmatter[parts[0].trim()] = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
        }
      });
      if (frontmatter.title) title = frontmatter.title;
      if (frontmatter['stats.total_tokens'] || frontmatter.total_tokens) {
        stats = `Turns: ${frontmatter['stats.turns'] || frontmatter.turns} | Tokens: ${(frontmatter['stats.total_tokens'] || frontmatter.total_tokens).toLocaleString()}`;
      }
    }

    vaultDocTitle.textContent = title;
    if (stats) {
      vaultDocMeta.style.display = 'block';
      vaultDocMeta.textContent = stats;
    } else {
      vaultDocMeta.style.display = 'none';
    }

    const htmlContent = parseVaultMarkdown(data.content);
    vaultDocContent.innerHTML = `<div class="vault-content-html">${htmlContent}</div>`;
  } catch (err) {
    console.error(err);
    vaultDocContent.innerHTML = `<div style="color: var(--accent-coral); text-align:center; padding: 40px;">Error loading file: ${err.message}</div>`;
  }
}

// Custom Markdown parser that styles Obsidian callouts and table grids
function parseVaultMarkdown(text) {
  // Remove YAML block
  let md = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Escape HTML tags to prevent execution issues
  md = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  // Scans line-by-line to parse lists, Obsidian blockquote callouts, and table cells
  const lines = md.split('\n');
  let inBlockquote = false;
  let blockquoteType = 'standard';
  let blockquoteContent = [];
  let htmlLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('&gt;')) {
      let content = line.substring(4).trim();
      
      if (content.startsWith('[!IMPORTANT]')) {
        blockquoteType = 'important';
        content = content.replace('[!IMPORTANT]', '<strong>📢 CRITICAL DIGEST</strong><br>');
      } else if (content.startsWith('[!WARNING]')) {
        blockquoteType = 'warning';
        content = content.replace('[!WARNING]', '<strong>📜 DIRECTIVE ASSESSMENT</strong><br>');
      } else if (content.startsWith('[!NOTE]') || content.startsWith('[!TIP]')) {
        blockquoteType = 'info';
        content = content.replace(/\[!(NOTE|TIP)\]/, '<strong>INFO</strong><br>');
      }

      blockquoteContent.push(content);
      inBlockquote = true;
    } else {
      if (inBlockquote) {
        htmlLines.push(`<blockquote class="callout-${blockquoteType}">${blockquoteContent.join('<br>')}</blockquote>`);
        blockquoteContent = [];
        blockquoteType = 'standard';
        inBlockquote = false;
      }
      htmlLines.push(lines[i]);
    }
  }
  if (inBlockquote) {
    htmlLines.push(`<blockquote class="callout-${blockquoteType}">${blockquoteContent.join('<br>')}</blockquote>`);
  }
  
  let html = htmlLines.join('\n');
  
  // Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const codeLines = code.trim().split('\n');
    let lang = '';
    if (codeLines[0].length < 15 && !codeLines[0].includes(' ') && codeLines[0].length > 0) {
      lang = codeLines.shift();
    }
    return `<pre><code class="language-${lang}">${codeLines.join('\n')}</code></pre>`;
  });

  // Inline Code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold / Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Headings
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^---$/gim, '<hr>');

  // Markdown Tables scan
  const tblLines = html.split('\n');
  let inTable = false;
  let tblRows = [];
  let finalHtml = [];

  for (let i = 0; i < tblLines.length; i++) {
    const line = tblLines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      const cols = line.split('|').slice(1, -1).map(c => c.trim());
      if (cols.every(c => c.startsWith('-'))) continue;
      tblRows.push(cols);
    } else {
      if (inTable) {
        let tableHtml = '<table>';
        tblRows.forEach((row, rIdx) => {
          tableHtml += '<tr>';
          row.forEach(col => {
            if (rIdx === 0) {
              tableHtml += `<th>${col}</th>`;
            } else {
              tableHtml += `<td>${col}</td>`;
            }
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</table>';
        finalHtml.push(tableHtml);
        tblRows = [];
        inTable = false;
      }
      finalHtml.push(tblLines[i]);
    }
  }
  if (inTable) {
    let tableHtml = '<table>';
    tblRows.forEach((row, rIdx) => {
      tableHtml += '<tr>';
      row.forEach(col => {
        if (rIdx === 0) {
          tableHtml += `<th>${col}</th>`;
        } else {
          tableHtml += `<td>${col}</td>`;
        }
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</table>';
    finalHtml.push(tableHtml);
  }

  return finalHtml.join('\n');
}

// Toast notification helper
function showFloatingNotification(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = type === 'error' ? 'rgba(255, 94, 98, 0.95)' : 'rgba(11, 12, 16, 0.95)';
  toast.style.color = '#fff';
  toast.style.border = `1px solid ${type === 'error' ? '#ff5e62' : 'var(--accent-cyan)'}`;
  toast.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.5)';
  toast.style.borderRadius = '8px';
  toast.style.padding = '12px 24px';
  toast.style.fontSize = '0.85rem';
  toast.style.zIndex = '9999';
  toast.style.backdropFilter = 'blur(10px)';
  toast.style.pointerEvents = 'none';
  toast.style.animation = 'messageSlideIn 0.3s ease-out';
  toast.textContent = msg;

  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
