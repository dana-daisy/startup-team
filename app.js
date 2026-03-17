// ─── Game State ───
let canvas, ctx;
let gameState = 'running';
let lastTime = 0;
let balance = 1000000;
let logEntries = [];
let speechBubbleTimeout = null;
let globalTime = 0;
let statusUpdateTimer = 0;

// ─── Agent color map for logs ───
const AGENT_COLORS = {
    '하늘': '#4A90D9', '솔': '#9B59B6', '루미': '#E91E8C',
    '태오': '#27AE60', '제로': '#F1C40F', '유나': '#E67E22',
    'meeting': '#ff6b9d'
};

// ─── Init ───
document.addEventListener('DOMContentLoaded', initializeGame);

function initializeGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    setupCanvas();
    initializeAgents();
    initializeUI();
    setupEventListeners();
    requestAnimationFrame(gameLoop);
}

function setupCanvas() {
    ctx.imageSmoothingEnabled = false;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const dashboard = document.querySelector('.dashboard');
    if (window.innerWidth <= 768) {
        canvas.width = window.innerWidth;
        canvas.height = Math.min(360, window.innerHeight * 0.4);
    } else {
        const dw = dashboard ? dashboard.offsetWidth + 3 : 263;
        canvas.width = Math.max(600, window.innerWidth - dw);
        canvas.height = Math.max(400, window.innerHeight - 190);
    }
    ctx.imageSmoothingEnabled = false;
}

function setupEventListeners() {
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); togglePause(); } });

    // Dashboard card clicks & profile popup close
    document.getElementById('profileClose').addEventListener('click', () => {
        document.getElementById('profilePopup').style.display = 'none';
    });
    document.getElementById('profilePopup').addEventListener('click', e => {
        if (e.target.id === 'profilePopup') e.target.style.display = 'none';
    });
}

function handleClick(e) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width, sy = canvas.height / r.height;
    findAndShowAgent((e.clientX - r.left) * sx, (e.clientY - r.top) * sy);
}
function handleTouch(e) {
    e.preventDefault();
    const t = e.touches[0], r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width, sy = canvas.height / r.height;
    findAndShowAgent((t.clientX - r.left) * sx, (t.clientY - r.top) * sy);
}

function findAndShowAgent(x, y) {
    if (!agentManager) return;
    for (const a of agentManager.agents) {
        if (Math.sqrt((x - a.x) ** 2 + (y - a.y) ** 2) < 24) {
            showProfilePopup(a);
            return;
        }
    }
}

function togglePause() {
    gameState = gameState === 'running' ? 'paused' : 'running';
    addLogEntry(gameState === 'paused' ? '⏸️ 일시정지' : '▶️ 재개');
}

// ─── Game Loop ───
function gameLoop(ts) {
    const dt = Math.min(ts - lastTime, 50); // cap at 50ms
    lastTime = ts;
    globalTime = ts;

    if (gameState === 'running') {
        updateAgents(dt);

        // UI update every 500ms
        statusUpdateTimer += dt;
        if (statusUpdateTimer > 500) {
            updateDateTime();
            updateAgentsStatusUI();
            statusUpdateTimer = 0;
        }

        // Revenue
        if (Math.random() < 0.0004) {
            const earn = 1000 + Math.floor(Math.random() * 10000);
            balance += earn;
            updateBalance();
            addLogEntry(`💰 수익 +₩${earn.toLocaleString()}`);
        }
    }

    render(ts);
    requestAnimationFrame(gameLoop);
}

// ─── Render ───
function render(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawOffice(time);
    drawAgents(ctx, time);
    if (gameState === 'paused') drawPauseOverlay();
}

function drawOffice(time) {
    const W = canvas.width, H = canvas.height;

    // Floor - warm wood tiles
    for (let x = 0; x < W; x += 32) {
        for (let y = 0; y < H; y += 32) {
            const checker = (Math.floor(x / 32) + Math.floor(y / 32)) % 2;
            ctx.fillStyle = checker ? '#c4a06a' : '#b8935a';
            ctx.fillRect(x, y, 32, 32);
            // subtle grain
            ctx.fillStyle = checker ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)';
            ctx.fillRect(x + 2, y + 14, 28, 1);
        }
    }

    // Walls
    // Top wall
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(0, 0, W, OFFICE.wallTop);
    ctx.fillStyle = '#d4c8b0';
    ctx.fillRect(0, OFFICE.wallTop - 4, W, 4);
    // Left wall
    ctx.fillStyle = '#e0d8c8';
    ctx.fillRect(0, 0, OFFICE.wallLeft, H);
    ctx.fillStyle = '#d4c8b0';
    ctx.fillRect(OFFICE.wallLeft - 4, 0, 4, H);

    // Windows on top wall
    for (let wx = 80; wx < W - 100; wx += 140) {
        // Window frame
        ctx.fillStyle = '#8ab4d6';
        ctx.fillRect(wx, 6, 80, 28);
        // Glass
        ctx.fillStyle = '#b8daf0';
        ctx.fillRect(wx + 3, 9, 35, 22);
        ctx.fillRect(wx + 42, 9, 35, 22);
        // Sky reflection
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(wx + 5, 11, 12, 8);
        ctx.fillRect(wx + 44, 11, 12, 8);
        // Divider
        ctx.fillStyle = '#7a9ab6';
        ctx.fillRect(wx + 38, 6, 4, 28);
        ctx.fillRect(wx, 18, 80, 3);
    }

    // Windows on left wall
    for (let wy = 100; wy < H - 80; wy += 150) {
        ctx.fillStyle = '#8ab4d6';
        ctx.fillRect(4, wy, 22, 60);
        ctx.fillStyle = '#b8daf0';
        ctx.fillRect(7, wy + 3, 16, 25);
        ctx.fillRect(7, wy + 32, 16, 25);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(9, wy + 5, 6, 10);
        ctx.fillStyle = '#7a9ab6';
        ctx.fillRect(4, wy + 28, 22, 4);
    }

    // Desks
    OFFICE.desks.forEach((d, i) => drawDesk(d.x, d.y, i, time));

    // Whiteboard
    drawWhiteboard();

    // Meeting table
    drawMeetingTable();

    // Coffee machine
    drawCoffeeMachine(time);

    // Plants
    OFFICE.plants.forEach(p => drawPlant(p.x, p.y, time));
}

function drawDesk(x, y, idx, time) {
    // Desk surface
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x, y, 70, 40);
    ctx.fillStyle = '#a07828';
    ctx.fillRect(x + 2, y + 2, 66, 36);
    // Legs
    ctx.fillStyle = '#6a5010';
    ctx.fillRect(x + 3, y + 38, 4, 6);
    ctx.fillRect(x + 63, y + 38, 4, 6);

    // Monitor
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 18, y - 20, 34, 24);
    // Screen with content
    const screenColors = ['#1a3a5c', '#1a4a2c', '#3a1a4c', '#1a3a3a', '#3a3a1a', '#3a2a1a'];
    ctx.fillStyle = screenColors[idx] || '#1a3a5c';
    ctx.fillRect(x + 20, y - 18, 30, 20);
    // Screen glow lines
    ctx.fillStyle = 'rgba(100,200,255,0.4)';
    for (let ly = 0; ly < 4; ly++) {
        ctx.fillRect(x + 22, y - 16 + ly * 5, 14 + Math.sin(time * 0.002 + ly) * 6, 2);
    }
    // Monitor stand
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 32, y + 4, 6, 4);
    ctx.fillRect(x + 28, y + 7, 14, 2);

    // Keyboard
    ctx.fillStyle = '#444';
    ctx.fillRect(x + 22, y + 14, 26, 8);
    ctx.fillStyle = '#555';
    for (let kx = 0; kx < 5; kx++) {
        for (let ky = 0; ky < 2; ky++) {
            ctx.fillRect(x + 24 + kx * 5, y + 15 + ky * 4, 3, 2);
        }
    }

    // Chair
    ctx.fillStyle = '#2c2c3e';
    ctx.fillRect(x + 24, y + 42, 22, 18);
    ctx.fillStyle = '#3a3a50';
    ctx.fillRect(x + 26, y + 44, 18, 14);
    // Chair back
    ctx.fillStyle = '#2c2c3e';
    ctx.fillRect(x + 26, y + 36, 18, 8);
}

function drawWhiteboard() {
    const wb = OFFICE.whiteboard;
    ctx.fillStyle = '#666';
    ctx.fillRect(wb.x, wb.y, wb.w, wb.h);
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(wb.x + 4, wb.y + 4, wb.w - 8, wb.h - 8);

    // Content
    ctx.fillStyle = '#e74c3c';
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText('ROADMAP', wb.x + 14, wb.y + 18);

    // Boxes
    ctx.fillStyle = '#3498db';
    ctx.fillRect(wb.x + 12, wb.y + 24, 24, 10);
    ctx.fillRect(wb.x + 42, wb.y + 24, 24, 10);
    ctx.fillRect(wb.x + 72, wb.y + 24, 30, 10);

    ctx.fillStyle = '#fff';
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText('MVP', wb.x + 17, wb.y + 31);
    ctx.fillText('Beta', wb.x + 46, wb.y + 31);
    ctx.fillText('Launch', wb.x + 74, wb.y + 31);

    // Arrows
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(wb.x + 37, wb.y + 28, 4, 2);
    ctx.fillRect(wb.x + 67, wb.y + 28, 4, 2);

    // Sticky notes
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(wb.x + 10, wb.y + 40, 18, 14);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(wb.x + 34, wb.y + 42, 18, 12);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(wb.x + 58, wb.y + 40, 18, 14);

    // Marker tray
    ctx.fillStyle = '#888';
    ctx.fillRect(wb.x + 20, wb.y + wb.h - 2, 60, 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(wb.x + 30, wb.y + wb.h - 1, 10, 2);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(wb.x + 45, wb.y + wb.h - 1, 10, 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(wb.x + 60, wb.y + wb.h - 1, 10, 2);
}

function drawMeetingTable() {
    const mt = OFFICE.meetingTable;
    // Oval table
    ctx.fillStyle = '#6a4e23';
    ctx.beginPath();
    ctx.ellipse(mt.x + mt.w / 2, mt.y + mt.h / 2, mt.w / 2, mt.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6e3a';
    ctx.beginPath();
    ctx.ellipse(mt.x + mt.w / 2, mt.y + mt.h / 2, mt.w / 2 - 3, mt.h / 2 - 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chairs around table
    const chairs = [
        { x: mt.x - 12, y: mt.y + 15 }, { x: mt.x + mt.w + 2, y: mt.y + 15 },
        { x: mt.x + 15, y: mt.y - 14 }, { x: mt.x + 50, y: mt.y - 14 },
        { x: mt.x + 15, y: mt.y + mt.h + 2 }, { x: mt.x + 50, y: mt.y + mt.h + 2 }
    ];
    chairs.forEach(c => {
        ctx.fillStyle = '#2c2c3e';
        ctx.fillRect(c.x, c.y, 14, 14);
        ctx.fillStyle = '#3a3a50';
        ctx.fillRect(c.x + 2, c.y + 2, 10, 10);
    });
}

function drawCoffeeMachine(time) {
    const cm = OFFICE.coffeeMachine;
    // Machine body
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(cm.x, cm.y, 36, 44);
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(cm.x + 2, cm.y + 2, 32, 40);

    // Display
    ctx.fillStyle = '#1a4a2a';
    ctx.fillRect(cm.x + 6, cm.y + 6, 24, 10);
    ctx.fillStyle = '#2ecc71';
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText('READY', cm.x + 8, cm.y + 13);

    // Buttons
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cm.x + 8, cm.y + 20, 6, 6);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(cm.x + 18, cm.y + 20, 6, 6);

    // Nozzle
    ctx.fillStyle = '#555';
    ctx.fillRect(cm.x + 14, cm.y + 28, 8, 4);

    // Cup
    ctx.fillStyle = '#fff';
    ctx.fillRect(cm.x + 12, cm.y + 33, 12, 8);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(cm.x + 13, cm.y + 34, 10, 4);
    // Steam
    if (Math.sin(time * 0.005) > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(cm.x + 15, cm.y + 28, 2, -4);
        ctx.fillRect(cm.x + 19, cm.y + 26, 2, -6);
    }

    // Extra cups nearby
    ctx.fillStyle = '#eee';
    ctx.fillRect(cm.x + 38, cm.y + 36, 8, 6);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(cm.x + 38, cm.y + 28, 8, 6);
}

function drawPlant(x, y, time) {
    const sway = Math.sin(time * 0.001 + x) * 1;
    // Pot
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(x, y + 18, 18, 12);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - 1, y + 16, 20, 4);
    // Soil
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(x + 2, y + 17, 14, 3);
    // Stems & leaves
    ctx.fillStyle = '#228b22';
    ctx.fillRect(x + 8 + sway, y, 2, 18);
    ctx.fillRect(x + 4 + sway, y + 4, 10, 4);
    ctx.fillRect(x + 6 + sway, y + 10, 6, 3);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 3 + sway, y + 2, 4, 4);
    ctx.fillRect(x + 11 + sway, y + 6, 4, 3);
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '14px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ 일시정지', canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('SPACE로 재개', canvas.width / 2, canvas.height / 2 + 16);
    ctx.textAlign = 'left';
}

// ─── UI Updates ───
function updateDateTime() {
    const now = new Date();
    document.getElementById('dateTime').textContent = now.toLocaleString('ko-KR', {
        month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function updateBalance() {
    document.getElementById('balance').textContent = balance.toLocaleString();
}

function updateAgentsStatusUI() {
    const container = document.getElementById('agentsStatus');
    const agents = getAgentsStatus();

    // Only rebuild if agent count changed (avoid flicker)
    if (container.children.length !== agents.length) {
        container.innerHTML = '';
        agents.forEach((a, i) => {
            const card = document.createElement('div');
            card.className = 'agent-card';
            card.dataset.index = i;
            card.addEventListener('click', () => showProfilePopup(agentManager.agents[i]));
            container.appendChild(card);
        });
    }

    // Update content
    const cards = container.querySelectorAll('.agent-card');
    agents.forEach((a, i) => {
        const card = cards[i];
        if (!card) return;
        card.style.borderLeftColor = a.color;
        card.innerHTML = `
            <div class="agent-card-header">
                <div class="agent-dot" style="background:${a.color}"></div>
                <span class="agent-name" style="color:${a.color}">${a.name}</span>
                <span class="agent-role-tag">${a.role}</span>
            </div>
            <div class="agent-task">${a.task}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                <span class="agent-status-icon status-${a.status}">● ${getStatusText(a.status)}</span>
                <span style="margin-left:auto;font-size:4px;color:#888;background:rgba(255,255,255,0.06);padding:2px 4px;border-radius:3px;">${a.engine}</span>
            </div>
        `;
    });
}

function getStatusText(s) {
    return { working: '작업 중', meeting: '회의 중', coffee: '커피 타임', moving: '이동 중', thinking: '생각 중' }[s] || s;
}

function updateProjectProgress(p) {
    document.getElementById('projectProgress').style.width = `${p}%`;
    document.getElementById('progressText').textContent = `${Math.round(p)}%`;
}

function addLogEntry(message, agentOrType = 'normal') {
    const logContent = document.getElementById('logContent');
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const color = AGENT_COLORS[agentOrType] || '#ccc';
    entry.style.color = color;

    const ts = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.textContent = `[${ts}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;

    if (logContent.children.length > 60) logContent.removeChild(logContent.firstChild);
    logEntries.push({ message, timestamp: new Date() });
    if (logEntries.length > 100) logEntries.shift();
}

function showProfilePopup(agent) {
    const popup = document.getElementById('profilePopup');
    document.getElementById('profileName').textContent = `${agent.name} (${agent.nameEn})`;
    document.getElementById('profileRole').textContent = `${agent.role}  ·  ${agent.engine}`;
    document.getElementById('profilePersonality').textContent = agent.personality;
    document.getElementById('profileTask').textContent = `현재: ${agent.currentTask}`;

    // Draw avatar
    const avatarDiv = document.getElementById('profileAvatar');
    avatarDiv.innerHTML = '';
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ac = c.getContext('2d');
    ac.scale(2, 2);
    SpriteRenderer._drawIdle(ac, 0, 0, agent.color, agent.accessory, 0);
    avatarDiv.appendChild(c);

    popup.style.display = 'flex';
}

function showSpeechBubble(x, y, text) {
    const bubble = document.getElementById('speechBubble');
    bubble.querySelector('.bubble-content').textContent = text;
    const r = canvas.getBoundingClientRect();
    const sx = r.width / canvas.width, sy = r.height / canvas.height;
    const bx = r.left + x * sx - 80, by = r.top + y * sy - 45;
    bubble.style.left = `${Math.max(5, Math.min(bx, window.innerWidth - 170))}px`;
    bubble.style.top = `${Math.max(5, by)}px`;
    bubble.style.display = 'block';
    if (speechBubbleTimeout) clearTimeout(speechBubbleTimeout);
    speechBubbleTimeout = setTimeout(() => { bubble.style.display = 'none'; }, 3000);
}

function initializeUI() {
    updateDateTime();
    updateBalance();
    setTimeout(() => addLogEntry('🚀 AI 스타트업 시뮬레이터 시작!'), 300);
    setTimeout(() => addLogEntry('👥 6명의 팀원이 출근했습니다.'), 1000);
    setTimeout(() => addLogEntry('📱 캐릭터를 클릭해서 프로필을 확인하세요.'), 1800);
}

// Global exports
window.addLogEntry = addLogEntry;
window.showSpeechBubble = showSpeechBubble;
window.updateProjectProgress = updateProjectProgress;
