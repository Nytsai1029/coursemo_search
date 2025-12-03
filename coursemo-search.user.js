// ==UserScript==
// @name         Coursemo Search
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  Search Coursemo papers by ID range and title with an on-page control panel.
// @match        https://mo.coursemo.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";
  // 监听键盘事件
    document.addEventListener('keydown', function(event) {
        // 检查是否按下了右箭头键 (keyCode: 39 或 ArrowRight)
        if (event.key === 'ArrowRight' || event.keyCode === 39) {
            event.preventDefault(); // 阻止默认行为

            // 获取当前URL
            const currentUrl = window.location.href;

            // 使用正则表达式提取ID
            const idMatch = currentUrl.match(/preview-questions\/(\d+)/);

            if (idMatch && idMatch[1]) {
                const currentId = parseInt(idMatch[1], 10);
                const newId = currentId + 1;

                // 构建新URL（保持其他参数不变）
                const newUrl = currentUrl.replace(
                    /preview-questions\/\d+/,
                    `preview-questions/${newId}`
                );

                // 跳转到新URL
                window.location.href = newUrl;

                // 可选：在控制台输出信息
                console.log(`ID从 ${currentId} 增加到 ${newId}，正在跳转...`);
            } else {
                console.warn('无法从URL中提取ID号');
            }
        }else if (event.key === 'ArrowLeft' || event.keyCode === 37) {
            event.preventDefault(); // 阻止默认行为

            // 获取当前URL
            const currentUrl = window.location.href;

            // 使用正则表达式提取ID
            const idMatch = currentUrl.match(/preview-questions\/(\d+)/);

            if (idMatch && idMatch[1]) {
                const currentId = parseInt(idMatch[1], 10);
                const newId = currentId - 1;

                // 构建新URL（保持其他参数不变）
                const newUrl = currentUrl.replace(
                    /preview-questions\/\d+/,
                    `preview-questions/${newId}`
                );

                // 跳转到新URL
                window.location.href = newUrl;

                // 可选：在控制台输出信息
                console.log(`ID从 ${currentId} 减少到 ${newId}，正在跳转...`);
            } else {
                console.warn('无法从URL中提取ID号');
            }
        }
    });
  const API_BASE = "https://pct.coursemo.com/api/yarpc/com.coursemo.pct.ExamService.get?id=";
  const LOCAL_KEYS = {
    token: "coursemo_token",
    user: "mo_user",
  };
  const normalizeToken = (raw) => {
    if (!raw) return "";
    return raw.startsWith("JWT ") ? raw : `JWT ${raw}`;
  };
  const loadLocalProfile = () => {
    const token = normalizeToken(localStorage.getItem(LOCAL_KEYS.token) || "");
    let user = {};
    try {
      user = JSON.parse(localStorage.getItem(LOCAL_KEYS.user) || "{}");
    } catch (err) {
      console.warn("Failed to parse mo_user from localStorage", err);
    }
    return {
      token,
      username: user.username || user.nickname || user.phone || "",
      phone: user.phone || user.username || "",
      userId: user.id,
      openid: user.openid,
      rawUser: user,
    };
  };
  const userProfile = loadLocalProfile();
  const DEFAULT_HEADERS = {
    accept: "application/json, text/javascript, */*; q=0.01",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,zh-TW;q=0.5,ja;q=0.4",
    authorization: userProfile.token,
    "sec-ch-ua": '"Chromium";v="142", "Microsoft Edge";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
  };

  const state = {
    isOpen: false,
    isSearching: false,
    matches: [],
    progress: { checked: 0, total: 0 },
  };

  const normalize = (value) => (value || "").toString().replace(/\s+/g, "").toLowerCase();
  const titleMatch = (title, query) => normalize(title).includes(normalize(query));
  const keywordMatch = (title, query) => {
    const normalizedTitle = normalize(title);
    const keywords = query
      .split(/[\s,]+/)
      .map((k) => normalize(k))
      .filter(Boolean);
    if (!keywords.length) return false;
    // All keywords must appear in the normalized title.
    return keywords.every((kw) => normalizedTitle.includes(kw));
  };

  const createStyles = () => {
    GM_addStyle(`
      #cm-search-toggle {
        position: fixed;
        bottom: 18px;
        left: 18px;
        z-index: 99999;
        background: linear-gradient(135deg, #101725, #1f3a5a);
        color: #f1f5ff;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 14px;
        padding: 10px 14px;
        font-size: 13px;
        font-family: "SF Pro Display", "Segoe UI", system-ui, -apple-system, sans-serif;
        box-shadow: 0 16px 40px rgba(6, 19, 43, 0.35);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
      }
      #cm-search-toggle:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 48px rgba(6, 19, 43, 0.45);
        opacity: 0.95;
      }
      #cm-search-panel {
        position: fixed;
        bottom: 68px;
        left: 18px;
        width: 520px;
        max-height: 620px;
        overflow: hidden;
        z-index: 99999;
        background: linear-gradient(160deg, #0d111a, #111a2a 40%, #152640 100%);
        color: #e9eefb;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(8px);
        padding: 14px 16px 12px;
        font-family: "SF Pro Display", "Segoe UI", system-ui, -apple-system, sans-serif;
        transform: translateY(16px);
        opacity: 0;
        pointer-events: none;
        transition: all 0.25s ease;
      }
      #cm-search-panel.cm-open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }
      #cm-search-panel h3 {
        margin: 0 0 8px;
        font-weight: 700;
        letter-spacing: 0.2px;
        font-size: 15px;
      }
      #cm-search-panel .cm-row {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      #cm-search-panel label {
        display: block;
        font-size: 11px;
        color: #94a3c3;
        margin-bottom: 4px;
        letter-spacing: 0.1px;
      }
      #cm-search-panel input {
        width: 100%;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        padding: 8px 10px;
        color: #f6f8ff;
        font-size: 13px;
        outline: none;
        transition: border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }
      #cm-search-panel input:focus {
        border-color: #80a7ff;
        box-shadow: 0 0 0 3px rgba(128, 167, 255, 0.22);
        background: rgba(255, 255, 255, 0.1);
      }
      #cm-search-panel button.cm-primary {
        width: 100%;
        background: linear-gradient(135deg, #4c8dff, #2b60e6);
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 10px 12px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 14px 36px rgba(43, 96, 230, 0.35);
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        margin-bottom: 10px;
      }
      #cm-search-panel button.cm-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }
      #cm-search-panel button.cm-primary:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 44px rgba(43, 96, 230, 0.45);
      }
      #cm-progress {
        font-size: 12px;
        color: #c3cce5;
        margin-bottom: 6px;
      }
      #cm-results {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 10px;
        max-height: 200px;
        overflow: auto;
      }
      #cm-results .cm-result {
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.07);
        margin-bottom: 8px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }
      #cm-results .cm-result:last-child {
        margin-bottom: 0;
      }
      #cm-results a {
        color: #9fc0ff;
        text-decoration: none;
        font-weight: 600;
      }
      #cm-results .cm-none {
        color: #9aa6c5;
        text-align: center;
      }
      @media print {
        #cm-search-toggle,
        #cm-search-panel {
          display: none !important;
        }
      }
    `);
  };

  const createUI = () => {
    const toggle = document.createElement("button");
    toggle.id = "cm-search-toggle";
    toggle.textContent = "Paper Search";

    const panel = document.createElement("div");
    panel.id = "cm-search-panel";
    panel.innerHTML = `
      <h3>Coursemo Paper Search</h3>
      <div class="cm-row">
        <div style="flex:1;">
          <label for="cm-start">Start ID</label>
          <input id="cm-start" type="number" placeholder="e.g. xxxxx" />
        </div>
        <div style="flex:1;">
          <label for="cm-end">End ID</label>
          <input id="cm-end" type="number" placeholder="e.g. xxxxx" />
        </div>
      </div>
      <div class="cm-row">
        <div style="flex:1;">
          <label for="cm-title">Target title</label>
          <input id="cm-title" type="text" placeholder="Example Test 1" />
        </div>
      </div>
      <div class="cm-row">
        <div style="flex:1;">
      <label for="cm-mode">Search mode</label>
      <select id="cm-mode" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:8px 10px;color:#f6f8ff;font-size:13px;outline:none;">
        <option value="keywords">Keywords only</option>
        <option value="title">Title contains</option>
        <option value="creator">Creator ID only</option>
      </select>
    </div>
  </div>
  <div class="cm-row">
    <div style="flex:1;">
      <label for="cm-keywords">Keywords (comma or space separated)</label>
      <input id="cm-keywords" type="text" placeholder="wave, physics, test" />
    </div>
  </div>
  <div class="cm-row">
    <div style="flex:1;">
      <label for="cm-creator">Creator ID</label>
      <input id="cm-creator" type="number" placeholder="e.g. 3308" />
    </div>
  </div>
      <div id="cm-progress">Idle</div>
      <button class="cm-primary" id="cm-search-btn">Start search</button>
      <div id="cm-results"><div class="cm-none">Waiting to start...</div></div>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    toggle.addEventListener("click", () => {
      state.isOpen = !state.isOpen;
      panel.classList.toggle("cm-open", state.isOpen);
    });

    const searchBtn = panel.querySelector("#cm-search-btn");
    searchBtn.addEventListener("click", () => {
      if (state.isSearching) return;
      const start = Number(panel.querySelector("#cm-start").value);
      const end = Number(panel.querySelector("#cm-end").value);
      const title = panel.querySelector("#cm-title").value.trim();
      const keywords = panel.querySelector("#cm-keywords").value.trim();
      const mode = panel.querySelector("#cm-mode").value;
      const creatorIdRaw = panel.querySelector("#cm-creator").value.trim();
      const creatorId = creatorIdRaw ? Number(creatorIdRaw) : NaN;
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        updateProgress("Please fill start ID and end ID.");
        return;
      }
      if (mode === "title" && !title) {
        updateProgress("Please enter a title when using title mode.");
        return;
      }
      if (mode === "keywords" && !keywords) {
        updateProgress("Please enter keywords when using keyword mode.");
        return;
      }
      if (mode === "creator" && !Number.isFinite(creatorId)) {
        updateProgress("Please enter a valid creator ID when using creator mode.");
        return;
      }
      runSearch({ start, end, title, keywords, creatorId, mode });
    });
  };

  const updateProgress = (text) => {
    const el = document.querySelector("#cm-progress");
    if (el) el.textContent = text;
  };

  const renderResults = () => {
    const container = document.querySelector("#cm-results");
    if (!container) return;
    container.innerHTML = "";
    if (!state.matches.length) {
      const empty = document.createElement("div");
      empty.className = "cm-none";
      empty.textContent = "No results for the current search.";
      container.appendChild(empty);
      return;
    }
    state.matches.forEach((match) => {
      const card = document.createElement("div");
      card.className = "cm-result";
      card.innerHTML = `
        <div style="font-size:13px;font-weight:700;">${match.name}</div>
        <div style="font-size:12px;color:#b7c4e2;margin:3px 0 6px;">ID: ${match.id}</div>
        <div style="font-size:12px;color:#9aa6c5;margin-bottom:6px;">Creator ID: ${match.creatorId ?? "N/A"}</div>
        <a href="${match.url}" target="_blank" rel="noopener">Open paper</a>
      `;
      container.appendChild(card);
    });
  };

  const fetchPaper = async (id) => {
    const res = await fetch(`${API_BASE}${id}`, {
      headers: DEFAULT_HEADERS,
      referrer: "https://mo.coursemo.com/",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.data;
  };

  const searchIds = async (ids, { mode, title, keywords, creatorId }, onProgress) => {
    const matches = [];
    const maxConcurrent = 8;
    let cursor = 0;
    const worker = async () => {
      while (cursor < ids.length) {
        const current = ids[cursor++];
        try {
          const paper = await fetchPaper(current);
          const name = paper?.name;
          const createdBy = paper?.created_user_id;
          let isMatch = false;
          if (mode === "creator") {
            isMatch = Number(createdBy) === creatorId;
          } else if (name) {
            if (mode === "title") {
              isMatch = titleMatch(name, title);
            } else if (mode === "keywords") {
              isMatch = keywordMatch(name, keywords);
            }
          }
          if (isMatch) {
            const displayName = name || "(no title)";
            matches.push({
              id: current,
              name: displayName,
              creatorId: createdBy,
              url: `https://mo.coursemo.com/tool/preview-questions/${current}?_from=core`,
            });
          }
        } catch (err) {
          // Swallow individual fetch errors to keep the loop running.
          console.warn("Paper fetch failed", current, err);
        } finally {
          state.progress.checked += 1;
          onProgress(state.progress);
        }
      }
    };
    const workers = [];
    const pool = Math.min(maxConcurrent, ids.length);
    for (let i = 0; i < pool; i++) workers.push(worker());
    await Promise.all(workers);
    return matches;
  };

  const runSearch = async ({ start, end, title, keywords, creatorId, mode }) => {
    if (!userProfile.token) {
      updateProgress("Missing token. Please set localStorage.coursemo_token before searching.");
      return;
    }
    const ids = [];
    const step = start <= end ? 1 : -1;
    for (let i = start; step === 1 ? i <= end : i >= end; i += step) ids.push(i);
    state.isSearching = true;
    state.matches = [];
    state.progress = { checked: 0, total: ids.length };
    updateProgress(`Searching ${ids.length} IDs...`);
    document.querySelector("#cm-search-btn").disabled = true;

    const matches = await searchIds(ids, { mode, title, keywords, creatorId }, (progress) => {
      updateProgress(`Checked ${progress.checked}/${progress.total}`);
    });

    state.matches = matches;
    renderResults();
    updateProgress(`Done. Checked ${ids.length} IDs.`);
    state.isSearching = false;
    document.querySelector("#cm-search-btn").disabled = false;
  };

  const init = () => {
    createStyles();
    createUI();
  };

  init();
})();
