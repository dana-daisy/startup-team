// 에이전트 클래스 정의
class Agent {
    constructor(name, role, color, x, y) {
        this.name = name;
        this.role = role;
        this.color = color;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.width = 32;
        this.height = 32;
        this.speed = 0.5;
        this.isWalking = false;
        this.isSitting = false;
        this.currentTask = '';
        this.taskTimer = 0;
        this.taskDuration = this.getRandomTaskDuration();
        this.meetingId = null;
        this.animationFrame = 0;
        this.direction = 'down'; // up, down, left, right
        this.speechBubble = null;
        this.lastTaskChange = Date.now();
        
        // 역할별 기본 업무
        this.tasks = this.getTasksByRole(role);
        this.selectRandomTask();
    }
    
    getTasksByRole(role) {
        const tasksByRole = {
            '기획자': [
                '시장 조사 중...', '경쟁사 분석 중...', '사용자 리서치 중...', 
                '기획서 작성 중...', '프로덕트 로드맵 작성 중...', '요구사항 정리 중...'
            ],
            '디자이너': [
                'UI 디자인 중...', 'UX 리서치 중...', '프로토타입 제작 중...', 
                '디자인 시스템 구축 중...', '사용자 플로우 설계 중...', '아이콘 디자인 중...'
            ],
            '개발자': [
                '코딩 중...', '버그 수정 중...', 'DB 설계 중...', 
                'API 개발 중...', '테스트 코드 작성 중...', '코드 리뷰 중...'
            ],
            '마케터': [
                '마케팅 전략 수립 중...', 'SNS 콘텐츠 제작 중...', '광고 캠페인 기획 중...', 
                '성과 분석 중...', '블로그 포스팅 중...', '고객 피드백 분석 중...'
            ]
        };
        return tasksByRole[role] || ['업무 중...'];
    }
    
    getRandomTaskDuration() {
        return Math.random() * 10000 + 5000; // 5-15초
    }
    
    selectRandomTask() {
        this.currentTask = this.tasks[Math.floor(Math.random() * this.tasks.length)];
        this.taskDuration = this.getRandomTaskDuration();
        this.taskTimer = 0;
        this.lastTaskChange = Date.now();
    }
    
    update() {
        this.taskTimer += 16; // ~60fps
        
        // 업무 변경
        if (this.taskTimer >= this.taskDuration) {
            this.selectRandomTask();
            this.logActivity();
        }
        
        // 이동 처리
        if (Math.abs(this.x - this.targetX) > 1 || Math.abs(this.y - this.targetY) > 1) {
            this.isWalking = true;
            this.isSitting = false;
            
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            
            // 방향 설정
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
            
            this.animationFrame += 0.2;
        } else {
            this.isWalking = false;
            this.animationFrame = 0;
            
            // 책상에 앉기 (특정 위치에서)
            if (this.isNearDesk()) {
                this.isSitting = true;
            }
        }
    }
    
    isNearDesk() {
        // 책상 위치들 (오피스 레이아웃에 맞춤)
        const desks = [
            {x: 150, y: 200}, {x: 250, y: 200}, {x: 350, y: 200},
            {x: 150, y: 350}, {x: 250, y: 350}, {x: 350, y: 350}
        ];
        
        return desks.some(desk => 
            Math.abs(this.x - desk.x) < 30 && Math.abs(this.y - desk.y) < 30
        );
    }
    
    moveToRandomPosition() {
        // 오피스 내 랜덤 위치로 이동 (벽 피하기)
        const margin = 50;
        const maxX = 750 - margin;
        const maxY = 550 - margin;
        
        this.targetX = margin + Math.random() * (maxX - margin);
        this.targetY = margin + Math.random() * (maxY - margin);
    }
    
    draw(ctx) {
        ctx.save();
        
        // 에이전트 몸체 (32x32 픽셀)
        this.drawSprite(ctx);
        
        // 말풍선 (가끔 표시)
        if (Math.random() < 0.01) { // 1% 확률로 말풍선
            this.showSpeechBubble();
        }
        
        ctx.restore();
    }
    
    drawSprite(ctx) {
        const spriteSize = 32;
        const x = Math.floor(this.x - spriteSize/2);
        const y = Math.floor(this.y - spriteSize/2);
        
        // 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 2, y + spriteSize - 4, spriteSize - 4, 6);
        
        // 머리
        ctx.fillStyle = this.color.hair;
        ctx.fillRect(x + 8, y + 4, 16, 12);
        
        // 얼굴
        ctx.fillStyle = '#fdbcb4';
        ctx.fillRect(x + 10, y + 8, 12, 8);
        
        // 눈
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 11, y + 9, 2, 2);
        ctx.fillRect(x + 16, y + 9, 2, 2);
        
        // 몸체
        ctx.fillStyle = this.color.shirt;
        if (this.isSitting) {
            // 앉아있는 모습
            ctx.fillRect(x + 6, y + 16, 20, 12);
        } else {
            // 서있는 모습
            ctx.fillRect(x + 8, y + 16, 16, 10);
            
            // 걷기 애니메이션
            if (this.isWalking) {
                const walkCycle = Math.sin(this.animationFrame) * 2;
                
                // 다리
                ctx.fillStyle = this.color.pants;
                ctx.fillRect(x + 10 + walkCycle, y + 26, 4, 6);
                ctx.fillRect(x + 18 - walkCycle, y + 26, 4, 6);
            } else {
                // 다리 (정지)
                ctx.fillStyle = this.color.pants;
                ctx.fillRect(x + 10, y + 26, 4, 6);
                ctx.fillRect(x + 18, y + 26, 4, 6);
            }
        }
        
        // 팔
        ctx.fillStyle = this.color.shirt;
        if (this.isSitting) {
            // 타이핑 자세
            ctx.fillRect(x + 4, y + 18, 6, 8);
            ctx.fillRect(x + 22, y + 18, 6, 8);
        } else {
            ctx.fillRect(x + 4, y + 18, 6, 10);
            ctx.fillRect(x + 22, y + 18, 6, 10);
        }
        
        // 역할 표시 아이콘
        this.drawRoleIcon(ctx, x + spriteSize + 5, y);
    }
    
    drawRoleIcon(ctx, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Press Start 2P"';
        
        const icons = {
            '기획자': '📋',
            '디자이너': '🎨',
            '개발자': '💻',
            '마케터': '📈'
        };
        
        const icon = icons[this.role] || '👤';
        ctx.fillText(icon, x, y + 10);
    }
    
    showSpeechBubble() {
        if (typeof showSpeechBubble === 'function') {
            showSpeechBubble(this.x, this.y - 40, this.currentTask);
        }
    }
    
    logActivity() {
        if (typeof addLogEntry === 'function') {
            addLogEntry(`${this.name}: ${this.currentTask}`, 'work');
        }
    }
}

// 에이전트 매니저
class AgentManager {
    constructor() {
        this.agents = [];
        this.meetingTimer = 0;
        this.meetingDuration = 30000; // 30초마다 회의 가능
        this.activeMeeting = null;
        this.projectProgress = 0;
        this.progressTimer = 0;
        
        this.initializeAgents();
    }
    
    initializeAgents() {
        // 6명의 에이전트 생성
        const agentConfigs = [
            {
                name: '기획자A',
                role: '기획자',
                color: { hair: '#8B4513', shirt: '#4169E1', pants: '#2F4F4F' },
                x: 150, y: 200
            },
            {
                name: '기획자B',
                role: '기획자',
                color: { hair: '#DAA520', shirt: '#32CD32', pants: '#2F4F4F' },
                x: 250, y: 200
            },
            {
                name: '디자이너',
                role: '디자이너',
                color: { hair: '#FF1493', shirt: '#FF69B4', pants: '#4B0082' },
                x: 350, y: 200
            },
            {
                name: '개발자A',
                role: '개발자',
                color: { hair: '#000000', shirt: '#008000', pants: '#000080' },
                x: 150, y: 350
            },
            {
                name: '개발자B',
                role: '개발자',
                color: { hair: '#A0522D', shirt: '#FF4500', pants: '#000080' },
                x: 250, y: 350
            },
            {
                name: '마케터',
                role: '마케터',
                color: { hair: '#FF6347', shirt: '#FFD700', pants: '#8B008B' },
                x: 350, y: 350
            }
        ];
        
        this.agents = agentConfigs.map(config => 
            new Agent(config.name, config.role, config.color, config.x, config.y)
        );
    }
    
    update() {
        // 에이전트 업데이트
        this.agents.forEach(agent => agent.update());
        
        // 회의 시스템
        this.meetingTimer += 16;
        if (this.meetingTimer >= this.meetingDuration && !this.activeMeeting) {
            this.startMeeting();
        }
        
        // 진행률 업데이트
        this.progressTimer += 16;
        if (this.progressTimer >= 1000) { // 1초마다
            this.updateProgress();
            this.progressTimer = 0;
        }
        
        // 랜덤 이동
        this.agents.forEach(agent => {
            if (Math.random() < 0.001 && !agent.isInMeeting) { // 0.1% 확률
                agent.moveToRandomPosition();
            }
        });
    }
    
    startMeeting() {
        // 랜덤하게 2-4명의 에이전트 선택
        const meetingSize = Math.floor(Math.random() * 3) + 2;
        const shuffled = [...this.agents].sort(() => 0.5 - Math.random());
        const participants = shuffled.slice(0, meetingSize);
        
        // 회의 위치 (화이트보드 근처)
        const meetingX = 600;
        const meetingY = 150;
        
        participants.forEach((agent, index) => {
            agent.targetX = meetingX + (index % 2) * 40;
            agent.targetY = meetingY + Math.floor(index / 2) * 40;
            agent.currentTask = '회의 중...';
            agent.isInMeeting = true;
        });
        
        this.activeMeeting = {
            participants: participants,
            duration: 0,
            maxDuration: 5000 + Math.random() * 10000 // 5-15초
        };
        
        if (typeof addLogEntry === 'function') {
            const names = participants.map(p => p.name).join(', ');
            addLogEntry(`회의 시작: ${names}`, 'meeting');
        }
        
        this.meetingTimer = 0;
    }
    
    updateMeeting() {
        if (!this.activeMeeting) return;
        
        this.activeMeeting.duration += 16;
        
        if (this.activeMeeting.duration >= this.activeMeeting.maxDuration) {
            // 회의 종료
            this.activeMeeting.participants.forEach(agent => {
                agent.isInMeeting = false;
                agent.selectRandomTask();
                agent.moveToRandomPosition();
            });
            
            if (typeof addLogEntry === 'function') {
                addLogEntry('회의가 끝났습니다.', 'meeting');
            }
            
            this.activeMeeting = null;
        }
    }
    
    updateProgress() {
        // 프로젝트 진행률 시뮬레이션
        const workingAgents = this.agents.filter(agent => 
            !agent.isInMeeting && agent.currentTask.includes('중...')
        );
        
        const progressIncrease = workingAgents.length * 0.1;
        this.projectProgress = Math.min(100, this.projectProgress + progressIncrease);
        
        // UI 업데이트
        if (typeof updateProjectProgress === 'function') {
            updateProjectProgress(this.projectProgress);
        }
    }
    
    draw(ctx) {
        this.agents.forEach(agent => agent.draw(ctx));
        
        // 회의 업데이트
        this.updateMeeting();
    }
    
    getAgentsStatus() {
        return this.agents.map(agent => ({
            name: agent.name,
            role: agent.role,
            task: agent.currentTask,
            status: agent.isInMeeting ? 'meeting' : 
                   agent.isSitting ? 'working' : 
                   agent.isWalking ? 'moving' : 'thinking'
        }));
    }
}

// 전역 에이전트 매니저
let agentManager = null;

function initializeAgents() {
    agentManager = new AgentManager();
    return agentManager;
}

function updateAgents() {
    if (agentManager) {
        agentManager.update();
    }
}

function drawAgents(ctx) {
    if (agentManager) {
        agentManager.draw(ctx);
    }
}

function getAgentsStatus() {
    return agentManager ? agentManager.getAgentsStatus() : [];
}