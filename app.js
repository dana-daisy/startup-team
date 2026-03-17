// 게임 변수
let canvas, ctx;
let gameState = 'running';
let lastTime = 0;
let balance = 1000000;
let logEntries = [];
let speechBubbleTimeout = null;

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Canvas 설정
    setupCanvas();
    
    // 에이전트 초기화
    initializeAgents();
    
    // UI 초기화
    initializeUI();
    
    // 게임 루프 시작
    gameLoop();
    
    // 이벤트 리스너 추가
    setupEventListeners();
    
    console.log('게임이 시작되었습니다!');
}

function setupCanvas() {
    // 캔버스 크기 조정
    resizeCanvas();
    
    // 픽셀 아트 렌더링 설정
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.querySelector('.game-area');
    const dashboard = document.querySelector('.dashboard');
    
    if (window.innerWidth <= 768) {
        // 모바일: 캔버스를 전체 너비로
        canvas.width = window.innerWidth - 20;
        canvas.height = Math.min(400, window.innerHeight * 0.4);
    } else {
        // 데스크톱: 대시보드 제외한 너비
        const dashboardWidth = dashboard ? dashboard.offsetWidth : 250;
        canvas.width = Math.max(600, window.innerWidth - dashboardWidth - 40);
        canvas.height = Math.max(400, window.innerHeight - 200);
    }
}

function setupEventListeners() {
    // 터치/클릭 이벤트
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    
    // 키보드 이벤트
    document.addEventListener('keydown', handleKeyPress);
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 클릭한 위치 근처의 에이전트 찾기
    const clickedAgent = findAgentAt(x, y);
    if (clickedAgent) {
        showAgentInfo(clickedAgent);
    }
}

function handleCanvasTouch(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const clickedAgent = findAgentAt(x, y);
    if (clickedAgent) {
        showAgentInfo(clickedAgent);
    }
}

function handleKeyPress(event) {
    // 스페이스바로 일시정지
    if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
    }
}

function findAgentAt(x, y) {
    const agents = agentManager.agents;
    for (let agent of agents) {
        const distance = Math.sqrt((x - agent.x) ** 2 + (y - agent.y) ** 2);
        if (distance < 30) {
            return agent;
        }
    }
    return null;
}

function showAgentInfo(agent) {
    showSpeechBubble(agent.x, agent.y - 50, `${agent.name}: ${agent.currentTask}`);
}

function togglePause() {
    gameState = gameState === 'running' ? 'paused' : 'running';
    addLogEntry(gameState === 'paused' ? '게임 일시정지' : '게임 재개');
}

// 게임 루프
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (gameState === 'running') {
        update(deltaTime);
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // 에이전트 업데이트
    updateAgents();
    
    // UI 업데이트
    updateDateTime();
    updateAgentsStatus();
    
    // 수익 업데이트 (시뮬레이션)
    if (Math.random() < 0.0005) { // 0.05% 확률
        const earnings = Math.floor(Math.random() * 10000) + 1000;
        balance += earnings;
        updateBalance();
        addLogEntry(`💰 수익 발생: +₩${earnings.toLocaleString()}`, 'work');
    }
}

function render() {
    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 배경 그리기
    drawOfficeBackground();
    
    // 오피스 가구 그리기
    drawOfficeFurniture();
    
    // 에이전트 그리기
    drawAgents(ctx);
    
    // UI 오버레이
    if (gameState === 'paused') {
        drawPauseOverlay();
    }
}

function drawOfficeBackground() {
    // 바닥
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 바닥 타일 패턴
    ctx.fillStyle = '#2d3748';
    for (let x = 0; x < canvas.width; x += 32) {
        for (let y = 0; y < canvas.height; y += 32) {
            if ((Math.floor(x/32) + Math.floor(y/32)) % 2 === 0) {
                ctx.fillRect(x, y, 32, 32);
            }
        }
    }
    
    // 벽
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, canvas.width, 20); // 상단벽
    ctx.fillRect(0, 0, 20, canvas.height); // 좌측벽
    ctx.fillRect(canvas.width - 20, 0, 20, canvas.height); // 우측벽
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20); // 하단벽
}

function drawOfficeFurniture() {
    // 책상들
    const desks = [
        {x: 120, y: 170}, {x: 220, y: 170}, {x: 320, y: 170},
        {x: 120, y: 320}, {x: 220, y: 320}, {x: 320, y: 320}
    ];
    
    desks.forEach(desk => drawDesk(desk.x, desk.y));
    
    // 화이트보드
    drawWhiteboard(550, 100);
    
    // 커피머신
    drawCoffeeMachine(500, 400);
    
    // 회의테이블
    drawMeetingTable(580, 200);
    
    // 화분들
    drawPlant(50, 100);
    drawPlant(50, 300);
    drawPlant(450, 450);
}

function drawDesk(x, y) {
    // 책상
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, 60, 40);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x + 2, y + 2, 56, 36);
    
    // 컴퓨터 모니터
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 15, y - 15, 30, 20);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + 17, y - 13, 26, 16);
    
    // 키보드
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 20, y + 15, 20, 8);
}

function drawWhiteboard(x, y) {
    // 화이트보드 프레임
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(x, y, 100, 60);
    
    // 화이트보드 면
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3, y + 3, 94, 54);
    
    // 낙서 (간단한 선들)
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 15);
    ctx.lineTo(x + 40, y + 25);
    ctx.lineTo(x + 70, y + 15);
    ctx.stroke();
    
    ctx.fillStyle = '#0066cc';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('ROADMAP', x + 20, y + 45);
}

function drawCoffeeMachine(x, y) {
    // 커피머신 본체
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(x, y, 40, 50);
    
    // 커피머신 앞면
    ctx.fillStyle = '#708090';
    ctx.fillRect(x + 2, y + 2, 36, 46);
    
    // 버튼들
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(x + 8, y + 15, 8, 8);
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(x + 24, y + 15, 8, 8);
    
    // 컵 받침
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x + 12, y + 35, 16, 8);
}

function drawMeetingTable(x, y) {
    // 회의테이블
    ctx.fillStyle = '#654321';
    ctx.fillRect(x, y, 80, 50);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 2, y + 2, 76, 46);
    
    // 의자들
    const chairs = [
        {x: x - 15, y: y + 10}, {x: x + 90, y: y + 10},
        {x: x + 10, y: y - 15}, {x: x + 50, y: y - 15}
    ];
    
    chairs.forEach(chair => {
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(chair.x, chair.y, 15, 15);
    });
}

function drawPlant(x, y) {
    // 화분
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y + 20, 20, 15);
    
    // 식물
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x + 8, y, 4, 25);
    ctx.fillRect(x + 4, y + 5, 12, 4);
    ctx.fillRect(x + 6, y + 12, 8, 4);
}

function drawPauseOverlay() {
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 일시정지 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('일시정지', canvas.width / 2, canvas.height / 2);
    ctx.fillText('스페이스바로 재개', canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'left';
}

// UI 업데이트 함수들
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('dateTime').textContent = now.toLocaleString('ko-KR', options);
}

function updateBalance() {
    document.getElementById('balance').textContent = balance.toLocaleString();
}

function updateAgentsStatus() {
    const statusContainer = document.getElementById('agentsStatus');
    const agents = getAgentsStatus();
    
    statusContainer.innerHTML = '';
    agents.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        
        card.innerHTML = `
            <div class="agent-name">${agent.name}</div>
            <div class="agent-task">${agent.task}</div>
            <div class="agent-status status-${agent.status}">● ${getStatusText(agent.status)}</div>
        `;
        
        statusContainer.appendChild(card);
    });
}

function getStatusText(status) {
    const statusTexts = {
        'working': '작업 중',
        'meeting': '회의 중',
        'moving': '이동 중',
        'thinking': '생각 중'
    };
    return statusTexts[status] || '알 수 없음';
}

function updateProjectProgress(progress) {
    const progressBar = document.getElementById('projectProgress');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
}

function addLogEntry(message, type = 'normal') {
    const logContent = document.getElementById('logContent');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    entry.textContent = `[${timestamp}] ${message}`;
    logContent.appendChild(entry);
    
    // 로그 스크롤 자동 이동
    logContent.scrollTop = logContent.scrollHeight;
    
    // 로그 항목 수 제한 (성능을 위해)
    if (logContent.children.length > 50) {
        logContent.removeChild(logContent.firstChild);
    }
    
    // 메모리에도 저장
    logEntries.push({ message, type, timestamp: new Date() });
    if (logEntries.length > 100) {
        logEntries.shift();
    }
}

function showSpeechBubble(x, y, text) {
    const bubble = document.getElementById('speechBubble');
    const bubbleContent = bubble.querySelector('.bubble-content');
    
    bubbleContent.textContent = text;
    
    // 위치 계산 (캔버스 상대 위치)
    const canvasRect = canvas.getBoundingClientRect();
    const bubbleX = canvasRect.left + x - 75; // 말풍선 중앙 정렬
    const bubbleY = canvasRect.top + y - 40;
    
    bubble.style.left = `${Math.max(10, Math.min(bubbleX, window.innerWidth - 160))}px`;
    bubble.style.top = `${Math.max(10, bubbleY)}px`;
    bubble.style.display = 'block';
    
    // 기존 타이머 제거
    if (speechBubbleTimeout) {
        clearTimeout(speechBubbleTimeout);
    }
    
    // 3초 후 숨기기
    speechBubbleTimeout = setTimeout(() => {
        bubble.style.display = 'none';
    }, 3000);
}

// 초기화 시 환영 메시지
function initializeUI() {
    updateDateTime();
    updateBalance();
    
    // 환영 메시지들
    setTimeout(() => addLogEntry('🎮 스타트업 팀 시뮬레이터에 오신 것을 환영합니다!'), 500);
    setTimeout(() => addLogEntry('👥 6명의 AI 팀원이 열심히 일하고 있습니다.'), 1500);
    setTimeout(() => addLogEntry('📱 에이전트를 클릭하면 상세 정보를 볼 수 있습니다.'), 2500);
    setTimeout(() => addLogEntry('⏸️ 스페이스바로 일시정지/재개할 수 있습니다.'), 3500);
}

// 디버깅용 함수들
function debugInfo() {
    console.log('게임 상태:', gameState);
    console.log('에이전트 수:', agentManager ? agentManager.agents.length : 0);
    console.log('캔버스 크기:', canvas.width, 'x', canvas.height);
    console.log('잔고:', balance);
}

// 전역 함수로 노출 (디버깅용)
window.debugInfo = debugInfo;
window.addLogEntry = addLogEntry;
window.showSpeechBubble = showSpeechBubble;
window.updateProjectProgress = updateProjectProgress;