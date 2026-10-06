/**
 * GULFI CHAT — APPLICATION CONTROLLER (app.js)
 * Full client-side interaction, Markdown rendering, IST live clock,
 * Web Audio sound synthesis, Web Speech API, and Chat History persistence.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Instantiate Gulfi Brain
  const brain = new GulfiBrain();

  // DOM Elements
  const chatStream = document.getElementById("chatStream");
  const welcomeHero = document.getElementById("welcomeHero");
  const chatInput = document.getElementById("chatInput");
  const chatForm = document.getElementById("chatForm");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  const typingIndicator = document.getElementById("typingIndicator");
  const messagesContainer = document.getElementById("messagesContainer");
  const chatHistoryList = document.getElementById("chatHistoryList");
  const newChatBtn = document.getElementById("newChatBtn");
  const floatingPillsBar = document.getElementById("floatingPillsBar");

  // Live IST elements
  const istLiveTime = document.getElementById("istLiveTime");
  const istLiveDate = document.getElementById("istLiveDate");

  // Action buttons
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");
  const soundToggleBtn = document.getElementById("soundToggleBtn");
  const soundOnIcon = document.getElementById("soundOnIcon");
  const soundOffIcon = document.getElementById("soundOffIcon");
  const exportChatBtn = document.getElementById("exportChatBtn");

  // Sidebar controls
  const sidebar = document.getElementById("sidebar");
  const openSidebarBtn = document.getElementById("openSidebarBtn");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");

  // Settings Modal
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const resetChatBtn = document.getElementById("resetChatBtn");
  const apiEndpointInput = document.getElementById("apiEndpointInput");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const apiModelInput = document.getElementById("apiModelInput");
  const ttsCheckbox = document.getElementById("ttsCheckbox");
  const soundEffectsCheckbox = document.getElementById("soundEffectsCheckbox");

  // State
  let soundEnabled = localStorage.getItem("gulfi_sound") !== "false";
  let ttsEnabled = localStorage.getItem("gulfi_tts") !== "false";
  let currentTheme = localStorage.getItem("gulfi_theme") || "dark";
  let chats = JSON.parse(localStorage.getItem("gulfi_chats") || "[]");
  let activeChatId = localStorage.getItem("gulfi_active_chat_id") || null;
  let activeCategory = "all";
  let isListening = false;
  let speechRecognition = null;

  // Initialize Audio Context for synthetic sound FX
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, delay = 0) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {
      // Audio autoplay policy
    }
  }

  function playSendSound() {
    playTone(520, "sine", 0.12);
  }

  function playReceiveSound() {
    playTone(587.33, "sine", 0.15); // D5
    playTone(880, "sine", 0.25, 0.08); // A5
  }

  // --- 1. LIVE IST CLOCK (Every second) ---
  function updateISTClock() {
    const ist = brain.getISTTime();
    istLiveTime.textContent = ist.time;
    istLiveDate.textContent = `${ist.day}, ${ist.date}`;
  }
  setInterval(updateISTClock, 1000);
  updateISTClock();

  // --- 2. THEME CONTROLLER ---
  function applyTheme(theme) {
    currentTheme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem("gulfi_theme", theme);
    if (theme === "dark") {
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    } else {
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    }
  }
  applyTheme(currentTheme);

  themeToggleBtn.addEventListener("click", () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });

  // Sound Toggle
  function updateSoundIcon() {
    if (soundEnabled) {
      soundOnIcon.classList.remove("hidden");
      soundOffIcon.classList.add("hidden");
    } else {
      soundOnIcon.classList.add("hidden");
      soundOffIcon.classList.remove("hidden");
    }
  }
  updateSoundIcon();

  soundToggleBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("gulfi_sound", soundEnabled);
    updateSoundIcon();
  });

  // --- 3. SPEECH SYNTHESIS (TTS) ---
  function speakText(text) {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop current speech
    
    // Clean markdown syntax from text for speech
    const cleanSpeech = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/[`*_#>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Attempt to pick an Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const inVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("ta-IN"));
    if (inVoice) utterance.voice = inVoice;

    window.speechSynthesis.speak(utterance);
  }

  // --- 4. SPEECH RECOGNITION (Voice Input) ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = "en-IN";

    speechRecognition.onstart = () => {
      isListening = true;
      micBtn.classList.add("listening");
      chatInput.placeholder = "Listening... Speak in English, Tamil, or Tanglish!";
    };

    speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      handleSendMessage();
    };

    speechRecognition.onerror = (e) => {
      console.warn("Speech error:", e);
      stopListening();
    };

    speechRecognition.onend = () => {
      stopListening();
    };
  } else {
    micBtn.style.opacity = "0.5";
    micBtn.title = "Speech recognition not supported in this browser";
  }

  function stopListening() {
    isListening = false;
    micBtn.classList.remove("listening");
    chatInput.placeholder = "Ask Gulfi in English, தமிழ், or Tanglish... (e.g. 'HTML basics sollu da')";
  }

  micBtn.addEventListener("click", () => {
    if (!speechRecognition) {
      alert("Your browser does not support Speech Recognition. Please try Google Chrome or Edge.");
      return;
    }
    if (isListening) {
      speechRecognition.stop();
    } else {
      speechRecognition.start();
    }
  });

  // --- 5. CHAT SESSIONS & STORAGE ---
  function getActiveChat() {
    return chats.find(c => c.id === activeChatId);
  }

  function createNewChat(initialTitle = "New Conversation") {
    const newChat = {
      id: "chat_" + Date.now(),
      title: initialTitle,
      category: "all",
      createdAt: new Date().toISOString(),
      messages: []
    };
    chats.unshift(newChat);
    activeChatId = newChat.id;
    saveChats();
    renderChatHistory();
    renderActiveChatMessages();
    chatInput.focus();
  }

  function saveChats() {
    localStorage.setItem("gulfi_chats", JSON.stringify(chats));
    localStorage.setItem("gulfi_active_chat_id", activeChatId);
  }

  function renderChatHistory() {
    chatHistoryList.innerHTML = "";
    const filteredChats = activeCategory === "all"
      ? chats
      : chats.filter(c => c.category === activeCategory);

    if (filteredChats.length === 0) {
      chatHistoryList.innerHTML = `<div style="padding: 12px; font-size: 0.78rem; color: var(--text-muted); text-align: center;">No conversations yet</div>`;
      return;
    }

    filteredChats.forEach(chat => {
      const item = document.createElement("div");
      item.className = `history-item ${chat.id === activeChatId ? "active" : ""}`;
      item.innerHTML = `
        <span class="history-title" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</span>
        <button class="history-delete-btn" title="Delete chat" data-id="${chat.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;

      item.addEventListener("click", (e) => {
        if (e.target.closest(".history-delete-btn")) return;
        activeChatId = chat.id;
        saveChats();
        renderChatHistory();
        renderActiveChatMessages();
        if (window.innerWidth <= 820) sidebar.classList.remove("open");
      });

      const delBtn = item.querySelector(".history-delete-btn");
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteChat(chat.id);
      });

      chatHistoryList.appendChild(item);
    });
  }

  function deleteChat(id) {
    chats = chats.filter(c => c.id !== id);
    if (activeChatId === id) {
      activeChatId = chats.length > 0 ? chats[0].id : null;
    }
    if (!activeChatId) {
      createNewChat();
    } else {
      saveChats();
      renderChatHistory();
      renderActiveChatMessages();
    }
  }

  newChatBtn.addEventListener("click", () => {
    createNewChat();
    if (window.innerWidth <= 820) sidebar.classList.remove("open");
  });

  // Category Filter Pills
  document.querySelectorAll(".pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      renderChatHistory();
    });
  });

  // --- 6. MESSAGE RENDERING & MARKDOWN PARSER ---
  function renderActiveChatMessages() {
    const currentChat = getActiveChat();
    chatStream.innerHTML = "";

    if (!currentChat || currentChat.messages.length === 0) {
      welcomeHero.classList.remove("hidden");
      floatingPillsBar.classList.remove("hidden");
      return;
    }

    welcomeHero.classList.add("hidden");
    floatingPillsBar.classList.add("hidden");

    currentChat.messages.forEach(msg => {
      appendMessageToDOM(msg.role, msg.content, msg.timestamp, false);
    });

    scrollToBottom();
  }

  function appendMessageToDOM(role, content, timestamp = null, animate = true) {
    welcomeHero.classList.add("hidden");
    floatingPillsBar.classList.add("hidden");

    const row = document.createElement("div");
    row.className = `message-row ${role === "user" ? "user" : "bot"}`;

    const istTimeStr = timestamp || brain.getISTTime().time;

    if (role === "bot") {
      row.innerHTML = `
        <div class="bot-avatar-col">
          <img src="assets/gulfi_avatar.jpg" alt="Gulfi">
        </div>
        <div class="message-content-wrap">
          <div class="message-bubble">${parseMarkdown(content)}</div>
          <div class="message-meta">
            <span>Gulfi Chat • ${istTimeStr}</span>
            <div class="message-actions">
              <button class="bubble-action-btn copy-msg-btn" title="Copy text">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Copy</span>
              </button>
              <button class="bubble-action-btn speak-msg-btn" title="Listen with voice">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                <span>Listen</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Wire copy button
      const copyBtn = row.querySelector(".copy-msg-btn");
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(content);
        copyBtn.querySelector("span").textContent = "Copied!";
        setTimeout(() => copyBtn.querySelector("span").textContent = "Copy", 2000);
      });

      // Wire TTS button
      const speakBtn = row.querySelector(".speak-msg-btn");
      speakBtn.addEventListener("click", () => {
        speakText(content);
      });

    } else {
      row.innerHTML = `
        <div class="message-content-wrap">
          <div class="message-bubble">${escapeHtml(content).replace(/\n/g, "<br>")}</div>
          <div class="message-meta">
            <span>You • ${istTimeStr}</span>
          </div>
        </div>
      `;
    }

    // Attach copy listeners for any code blocks inside
    row.querySelectorAll(".copy-code-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const codeText = btn.dataset.code;
        navigator.clipboard.writeText(codeText);
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy", 2000);
      });
    });

    chatStream.appendChild(row);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // --- 7. POWERFUL MARKDOWN PARSER WITH CODE BLOCKS ---
  function parseMarkdown(md) {
    if (!md) return "";

    // 1. Code blocks with Mac dots & Copy button
    let html = md.replace(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang.trim() || "code";
      const cleanCode = code.trim();
      const escapedCode = escapeHtml(cleanCode);
      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <div class="mac-dots">
              <span class="mac-dot red"></span>
              <span class="mac-dot yellow"></span>
              <span class="mac-dot green"></span>
            </div>
            <span class="code-lang-tag">${language}</span>
            <button class="copy-code-btn" data-code="${escapeAttr(cleanCode)}">Copy</button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>
      `;
    });

    // 2. Blockquotes
    html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

    // 3. Headings
    html = html.replace(/^#### (.*$)/gim, "<h4>$1</h4>");
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // 4. Horizontal Rule
    html = html.replace(/^---$/gim, "<hr>");

    // 5. Bold & Italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // 6. Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // 7. Bullet lists
    html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    // 8. Numbered lists
    html = html.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");

    // 9. Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 10. Paragraphs & Line Breaks
    html = html.replace(/\n\n+/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");

    return `<p>${html}</p>`;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(str) {
    return str
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // --- 8. SEND MESSAGE PIPELINE ---
  async function handleSendMessage() {
    const rawText = chatInput.value.trim();
    if (!rawText) return;

    // Reset textarea height
    chatInput.value = "";
    chatInput.style.height = "auto";

    let currentChat = getActiveChat();
    if (!currentChat) {
      createNewChat(rawText.slice(0, 30));
      currentChat = getActiveChat();
    }

    // If first message in this chat, set smart title
    if (currentChat.messages.length === 0) {
      currentChat.title = rawText.length > 28 ? rawText.slice(0, 28) + "..." : rawText;
      // Categorize automatically
      const lower = rawText.toLowerCase();
      if (lower.includes("code") || lower.includes("html") || lower.includes("python") || lower.includes("sql") || lower.includes("css")) {
        currentChat.category = "coding";
      } else if (lower.includes("mark") || lower.includes("exam") || lower.includes("define")) {
        currentChat.category = "exam";
      } else if (lower.includes("project") || lower.includes("hackathon")) {
        currentChat.category = "projects";
      } else if (lower.includes("caption") || lower.includes("quote") || lower.includes("bio")) {
        currentChat.category = "creative";
      }
      renderChatHistory();
    }

    const istNow = brain.getISTTime().time;

    // 1. Add User Message
    currentChat.messages.push({
      role: "user",
      content: rawText,
      timestamp: istNow
    });
    saveChats();
    appendMessageToDOM("user", rawText, istNow);
    playSendSound();

    // 2. Show Typing Indicator
    typingIndicator.classList.remove("hidden");
    scrollToBottom();

    // 3. Process via Gulfi Brain
    try {
      // Simulate natural realistic processing pause (300ms - 600ms)
      await new Promise(r => setTimeout(r, 450));

      const botReply = await brain.respond(rawText, currentChat.messages);

      // Hide Typing Indicator
      typingIndicator.classList.add("hidden");

      const botIST = brain.getISTTime().time;
      currentChat.messages.push({
        role: "bot",
        content: botReply,
        timestamp: botIST
      });
      saveChats();
      appendMessageToDOM("bot", botReply, botIST);
      playReceiveSound();

      // Read aloud if TTS is enabled
      if (ttsEnabled) {
        speakText(botReply);
      }
    } catch (error) {
      console.error("Gulfi processing error:", error);
      typingIndicator.classList.add("hidden");
      const errReply = "Oops, ennala process panna mudiyala da! Please try again or rephrase your question. 😊";
      appendMessageToDOM("bot", errReply);
    }
  }

  // Textarea auto-resize and Enter key behavior
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + "px";
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSendMessage();
  });

  // --- 9. QUICK PROMPT PILLS CLICK HANDLERS ---
  document.addEventListener("click", (e) => {
    const pill = e.target.closest(".quick-prompt-pill, .float-pill");
    if (pill && pill.dataset.prompt) {
      chatInput.value = pill.dataset.prompt;
      handleSendMessage();
    }
  });

  // --- 10. EXPORT CHAT CONVERSATION ---
  exportChatBtn.addEventListener("click", () => {
    const currentChat = getActiveChat();
    if (!currentChat || currentChat.messages.length === 0) {
      alert("No messages to export yet!");
      return;
    }

    let exportContent = `# ${currentChat.title}\n`;
    exportContent += `Exported on: ${brain.getISTTime().fullString}\n\n---\n\n`;

    currentChat.messages.forEach(m => {
      const sender = m.role === "user" ? "👤 You" : "🤖 Gulfi Chat";
      exportContent += `### ${sender} (${m.timestamp})\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([exportContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gulfi_chat_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // --- 11. SIDEBAR MOBILE DRAWER ---
  openSidebarBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
  });
  closeSidebarBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });

  // --- 12. SETTINGS MODAL ---
  settingsBtn.addEventListener("click", () => {
    apiEndpointInput.value = localStorage.getItem("gulfi_endpoint") || "";
    apiKeyInput.value = localStorage.getItem("gulfi_api_key") || "";
    apiModelInput.value = localStorage.getItem("gulfi_model") || "";
    ttsCheckbox.checked = ttsEnabled;
    soundEffectsCheckbox.checked = soundEnabled;
    settingsModal.classList.remove("hidden");
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });

  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.classList.add("hidden");
  });

  saveSettingsBtn.addEventListener("click", () => {
    localStorage.setItem("gulfi_endpoint", apiEndpointInput.value.trim());
    localStorage.setItem("gulfi_api_key", apiKeyInput.value.trim());
    localStorage.setItem("gulfi_model", apiModelInput.value.trim());
    
    ttsEnabled = ttsCheckbox.checked;
    localStorage.setItem("gulfi_tts", ttsEnabled);

    soundEnabled = soundEffectsCheckbox.checked;
    localStorage.setItem("gulfi_sound", soundEnabled);
    updateSoundIcon();

    // Update brain instance settings
    brain.customEndpoint = apiEndpointInput.value.trim();
    brain.customApiKey = apiKeyInput.value.trim();
    brain.customModel = apiModelInput.value.trim();

    settingsModal.classList.add("hidden");
  });

  resetChatBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all chat history?")) {
      chats = [];
      localStorage.removeItem("gulfi_chats");
      localStorage.removeItem("gulfi_active_chat_id");
      createNewChat();
      settingsModal.classList.add("hidden");
    }
  });

  // --- 13. INITIAL BOOTSTRAP ---
  if (chats.length === 0) {
    createNewChat();
  } else {
    if (!activeChatId || !chats.some(c => c.id === activeChatId)) {
      activeChatId = chats[0].id;
    }
    renderChatHistory();
    renderActiveChatMessages();
  }
});
