// ─── 팀원 데이터 ───
const TEAM_DATA = [
    {
        name: '하늘', nameEn: 'Haneul', role: 'PM / 기획 리더', engine: 'Claude Opus',
        personality: '차분하고 조직적. 팀의 방향을 잡고 일정을 관리하는 리더.',
        color: { main: '#4A90D9', hair: '#1a1a3a', shirt: '#4A90D9', pants: '#2c3e6b', accent: '#4A90D9' },
        accessory: 'tie',
        tasks: ['일정 조율 중...', '로드맵 업데이트...', '팀 회의 소집...', '스프린트 계획...', 'KPI 리뷰 중...', '이해관계자 미팅...'],
        deskIndex: 0
    },
    {
        name: '솔', nameEn: 'Sol', role: '기획 / 리서치', engine: 'Perplexity',
        personality: '호기심 많고 분석적. 데이터로 인사이트를 뽑아내는 리서처.',
        color: { main: '#9B59B6', hair: '#2d1a3a', shirt: '#9B59B6', pants: '#4a2d5e', accent: '#9B59B6' },
        accessory: 'glasses',
        tasks: ['시장 조사 중...', '경쟁사 분석...', '데이터 수집...', '사용자 인터뷰 분석...', '트렌드 보고서 작성...', 'A/B테스트 설계...'],
        deskIndex: 1
    },
    {
        name: '루미', nameEn: 'Lumi', role: 'UI/UX 디자이너', engine: 'GPT-4o',
        personality: '감성적이고 섬세한 디자이너. 아름다운 경험을 만드는 것이 목표.',
        color: { main: '#E91E8C', hair: '#3a1a2a', shirt: '#E91E8C', pants: '#5e2d4a', accent: '#E91E8C' },
        accessory: 'beret',
        tasks: ['와이어프레임 작업...', 'UI 디자인 중...', '색상 팔레트 고민...', '프로토타입 제작...', '디자인 시스템 정리...', '아이콘 세트 작업...'],
        deskIndex: 2
    },
    {
        name: '태오', nameEn: 'Tao', role: '풀스택 개발 리드', engine: 'Claude Code',
        personality: '묵묵하고 실력 있는 개발 리드. 아키텍처부터 배포까지.',
        color: { main: '#27AE60', hair: '#1a2a1a', shirt: '#27AE60', pants: '#1a3a2a', accent: '#27AE60' },
        accessory: 'hoodie',
        tasks: ['아키텍처 설계...', '코드 리뷰 중...', '배포 준비...', 'DB 마이그레이션...', 'CI/CD 파이프라인...', 'API 최적화...'],
        deskIndex: 3
    },
    {
        name: '제로', nameEn: 'Zero', role: '프론트엔드 개발', engine: 'Grok',
        personality: '에너지 넘치는 프론트엔드 장인. 픽셀 하나에도 진심.',
        color: { main: '#F1C40F', hair: '#3a2a1a', shirt: '#F1C40F', pants: '#5e4a1a', accent: '#F1C40F' },
        accessory: 'headphones',
        tasks: ['CSS 애니메이션...', '반응형 작업...', '컴포넌트 개발...', '성능 최적화...', '크로스브라우저 테스트...', '인터랙션 구현...'],
        deskIndex: 4
    },
    {
        name: '유나', nameEn: 'Yuna', role: '마케터 / 그로스', engine: 'Gemini',
        personality: '밝고 사교적. 제품을 세상에 알리는 데 열정적인 그로스 해커.',
        color: { main: '#E67E22', hair: '#3a1a0a', shirt: '#E67E22', pants: '#5e3a1a', accent: '#E67E22' },
        accessory: 'headband',
        tasks: ['SNS 콘텐츠 작성...', '광고 성과 분석...', '트렌드 리서치...', '뉴스레터 작성...', '인플루언서 섭외...', '퍼널 분석 중...'],
        deskIndex: 5
    }
];

// ─── 오피스 레이아웃 ───
const OFFICE = {
    wallTop: 40, wallLeft: 30,
    desks: [
        { x: 100, y: 140 }, { x: 220, y: 140 }, { x: 340, y: 140 },
        { x: 100, y: 300 }, { x: 220, y: 300 }, { x: 340, y: 300 }
    ],
    meetingTable: { x: 560, y: 280, w: 90, h: 60 },
    whiteboard: { x: 540, y: 60, w: 120, h: 70 },
    coffeeMachine: { x: 560, y: 430 },
    plants: [{ x: 42, y: 80 }, { x: 42, y: 240 }, { x: 42, y: 400 }, { x: 470, y: 430 }]
};

// ─── Pixel Sprite Renderer (32x32) ───
const SpriteRenderer = {
    drawAgent(ctx, agent, time) {
        const x = Math.floor(agent.x - 16);
        const y = Math.floor(agent.y - 16);
        const d = agent.color;
        const frame = time * 0.003;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        this._oval(ctx, x + 8, y + 29, 16, 5);

        if (agent.isSitting) {
            this._drawSitting(ctx, x, y, d, agent.accessory, frame);
        } else if (agent.isWalking) {
            this._drawWalking(ctx, x, y, d, agent.accessory, agent.animFrame);
        } else {
            this._drawIdle(ctx, x, y, d, agent.accessory, frame);
        }

        // Name tag
        ctx.fillStyle = d.main;
        ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(agent.name, x + 16, y - 4);
        ctx.textAlign = 'left';
    },

    _drawIdle(ctx, x, y, c, acc, f) {
        const bob = Math.sin(f * 2) * 1; // idle bob

        // Hair / Head
        ctx.fillStyle = c.hair;
        this._r(ctx, x + 8, y + 2 + bob, 16, 10);
        // Face
        ctx.fillStyle = '#FDBCB4';
        this._r(ctx, x + 10, y + 5 + bob, 12, 8);
        // Eyes
        ctx.fillStyle = '#222';
        this._r(ctx, x + 12, y + 7 + bob, 2, 2);
        this._r(ctx, x + 18, y + 7 + bob, 2, 2);
        // Mouth
        ctx.fillStyle = '#c97';
        this._r(ctx, x + 14, y + 10 + bob, 4, 1);

        // Accessory
        this._drawAccessory(ctx, x, y + bob, acc, c);

        // Body
        ctx.fillStyle = c.shirt;
        this._r(ctx, x + 8, y + 13 + bob, 16, 10);
        // Arms
        this._r(ctx, x + 4, y + 14 + bob, 5, 9);
        this._r(ctx, x + 23, y + 14 + bob, 5, 9);
        // Legs
        ctx.fillStyle = c.pants;
        this._r(ctx, x + 10, y + 23 + bob, 5, 7);
        this._r(ctx, x + 17, y + 23 + bob, 5, 7);
        // Shoes
        ctx.fillStyle = '#333';
        this._r(ctx, x + 9, y + 29 + bob, 6, 2);
        this._r(ctx, x + 17, y + 29 + bob, 6, 2);
    },

    _drawWalking(ctx, x, y, c, acc, af) {
        const legSwing = Math.sin(af) * 3;

        // Head
        ctx.fillStyle = c.hair;
        this._r(ctx, x + 8, y + 2, 16, 10);
        ctx.fillStyle = '#FDBCB4';
        this._r(ctx, x + 10, y + 5, 12, 8);
        ctx.fillStyle = '#222';
        this._r(ctx, x + 12, y + 7, 2, 2);
        this._r(ctx, x + 18, y + 7, 2, 2);
        ctx.fillStyle = '#c97';
        this._r(ctx, x + 14, y + 10, 4, 1);

        this._drawAccessory(ctx, x, y, acc, c);

        // Body
        ctx.fillStyle = c.shirt;
        this._r(ctx, x + 8, y + 13, 16, 10);
        // Arms swinging
        this._r(ctx, x + 4, y + 14 - legSwing, 5, 9);
        this._r(ctx, x + 23, y + 14 + legSwing, 5, 9);
        // Legs
        ctx.fillStyle = c.pants;
        this._r(ctx, x + 10 + legSwing, y + 23, 5, 7);
        this._r(ctx, x + 17 - legSwing, y + 23, 5, 7);
        // Shoes
        ctx.fillStyle = '#333';
        this._r(ctx, x + 9 + legSwing, y + 29, 6, 2);
        this._r(ctx, x + 17 - legSwing, y + 29, 6, 2);
    },

    _drawSitting(ctx, x, y, c, acc, f) {
        const typeBob = Math.sin(f * 6) * 0.5;

        // Head
        ctx.fillStyle = c.hair;
        this._r(ctx, x + 8, y + 4, 16, 10);
        ctx.fillStyle = '#FDBCB4';
        this._r(ctx, x + 10, y + 7, 12, 8);
        ctx.fillStyle = '#222';
        this._r(ctx, x + 12, y + 9, 2, 2);
        this._r(ctx, x + 18, y + 9, 2, 2);

        this._drawAccessory(ctx, x, y + 2, acc, c);

        // Body (seated, shorter)
        ctx.fillStyle = c.shirt;
        this._r(ctx, x + 6, y + 15, 20, 10);
        // Arms forward (typing)
        this._r(ctx, x + 2, y + 16 + typeBob, 6, 8);
        this._r(ctx, x + 24, y + 16 - typeBob, 6, 8);
        // Legs bent
        ctx.fillStyle = c.pants;
        this._r(ctx, x + 8, y + 25, 7, 4);
        this._r(ctx, x + 17, y + 25, 7, 4);
    },

    _drawAccessory(ctx, x, y, acc, c) {
        switch (acc) {
            case 'tie': // 하늘 - 넥타이
                ctx.fillStyle = '#e74c3c';
                this._r(ctx, x + 15, y + 13, 2, 8);
                this._r(ctx, x + 13, y + 13, 6, 2);
                break;
            case 'glasses': // 솔 - 안경
                ctx.fillStyle = '#ddd';
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 11, y + 6, 4, 4);
                ctx.strokeRect(x + 17, y + 6, 4, 4);
                this._r(ctx, x + 15, y + 7, 2, 1);
                break;
            case 'beret': // 루미 - 베레모
                ctx.fillStyle = '#E91E8C';
                this._r(ctx, x + 6, y + 0, 20, 5);
                this._r(ctx, x + 14, y - 2, 4, 3);
                break;
            case 'hoodie': // 태오 - 후디
                ctx.fillStyle = '#1a8a40';
                this._r(ctx, x + 8, y + 1, 16, 4);
                this._r(ctx, x + 10, y + 3, 4, 4);
                this._r(ctx, x + 18, y + 3, 4, 4);
                break;
            case 'headphones': // 제로 - 헤드폰
                ctx.fillStyle = '#333';
                this._r(ctx, x + 6, y + 1, 20, 3);
                ctx.fillStyle = '#F1C40F';
                this._r(ctx, x + 6, y + 4, 4, 5);
                this._r(ctx, x + 22, y + 4, 4, 5);
                break;
            case 'headband': // 유나 - 머리띠
                ctx.fillStyle = '#E67E22';
                this._r(ctx, x + 7, y + 2, 18, 2);
                ctx.fillStyle = '#f39c12';
                this._r(ctx, x + 22, y + 0, 4, 4);
                break;
        }
    },

    _r(ctx, x, y, w, h) { ctx.fillRect(Math.floor(x), Math.floor(y), w, h); },
    _oval(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
};

// ─── Agent Class ───
class Agent {
    constructor(data) {
        const desk = OFFICE.desks[data.deskIndex];
        this.name = data.name;
        this.nameEn = data.nameEn;
        this.role = data.role;
        this.engine = data.engine;
        this.personality = data.personality;
        this.color = data.color;
        this.accessory = data.accessory;
        this.tasks = data.tasks;
        this.deskIndex = data.deskIndex;

        this.homeX = desk.x + 30;
        this.homeY = desk.y + 50;
        this.x = this.homeX;
        this.y = this.homeY;
        this.targetX = this.x;
        this.targetY = this.y;
        this.speed = 0.8;

        this.isWalking = false;
        this.isSitting = true;
        this.isInMeeting = false;
        this.isGettingCoffee = false;
        this.animFrame = 0;

        this.currentTask = '';
        this.taskTimer = 0;
        this.taskDuration = 0;
        this.selectRandomTask();
    }

    selectRandomTask() {
        this.currentTask = this.tasks[Math.floor(Math.random() * this.tasks.length)];
        this.taskDuration = 5000 + Math.random() * 12000;
        this.taskTimer = 0;
    }

    getStatus() {
        if (this.isInMeeting) return 'meeting';
        if (this.isGettingCoffee) return 'coffee';
        if (this.isWalking) return 'moving';
        if (this.isSitting) return 'working';
        return 'thinking';
    }

    goTo(tx, ty) { this.targetX = tx; this.targetY = ty; }
    goHome() { this.goTo(this.homeX, this.homeY); }

    update(dt) {
        this.taskTimer += dt;
        if (this.taskTimer >= this.taskDuration && !this.isInMeeting && !this.isGettingCoffee) {
            this.selectRandomTask();
            if (typeof addLogEntry === 'function') {
                addLogEntry(`${this.name}: ${this.currentTask}`, this.name);
            }
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
            this.isWalking = true;
            this.isSitting = false;
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            this.animFrame += 0.15;
        } else {
            this.isWalking = false;
            this.animFrame = 0;
            // Sit if near home desk
            const homeDist = Math.sqrt((this.x - this.homeX) ** 2 + (this.y - this.homeY) ** 2);
            this.isSitting = homeDist < 10;
        }
    }

    draw(ctx, time) {
        SpriteRenderer.drawAgent(ctx, this, time);
    }
}

// ─── Agent Manager ───
class AgentManager {
    constructor() {
        this.agents = TEAM_DATA.map(d => new Agent(d));
        this.meetingTimer = 0;
        this.coffeeTimer = 0;
        this.activeMeeting = null;
        this.projectProgress = 0;
        this.progressTimer = 0;
    }

    update(dt) {
        this.agents.forEach(a => a.update(dt));

        // Meeting system
        this.meetingTimer += dt;
        if (this.meetingTimer > 25000 && !this.activeMeeting) {
            this._startMeeting();
            this.meetingTimer = 0;
        }
        if (this.activeMeeting) this._updateMeeting(dt);

        // Coffee event
        this.coffeeTimer += dt;
        if (this.coffeeTimer > 18000) {
            this._sendForCoffee();
            this.coffeeTimer = Math.random() * -8000;
        }

        // Random wander
        this.agents.forEach(a => {
            if (!a.isInMeeting && !a.isGettingCoffee && Math.random() < 0.0003) {
                const margin = 60;
                a.goTo(margin + Math.random() * 400, margin + Math.random() * 400);
                setTimeout(() => { if (!a.isInMeeting && !a.isGettingCoffee) a.goHome(); }, 4000 + Math.random() * 3000);
            }
        });

        // Progress
        this.progressTimer += dt;
        if (this.progressTimer > 1000) {
            const working = this.agents.filter(a => !a.isInMeeting && !a.isGettingCoffee).length;
            this.projectProgress = Math.min(100, this.projectProgress + working * 0.08);
            if (typeof updateProjectProgress === 'function') updateProjectProgress(this.projectProgress);
            this.progressTimer = 0;
        }
    }

    _startMeeting() {
        const count = 2 + Math.floor(Math.random() * 2); // 2-3
        const pool = this.agents.filter(a => !a.isGettingCoffee);
        const shuffled = pool.sort(() => 0.5 - Math.random());
        const participants = shuffled.slice(0, count);
        const mt = OFFICE.meetingTable;

        participants.forEach((a, i) => {
            a.isInMeeting = true;
            a.currentTask = '회의 중...';
            const angle = (i / count) * Math.PI * 2;
            a.goTo(mt.x + mt.w / 2 + Math.cos(angle) * 35, mt.y + mt.h / 2 + Math.sin(angle) * 25);
        });

        this.activeMeeting = { participants, elapsed: 0, duration: 6000 + Math.random() * 8000 };
        if (typeof addLogEntry === 'function') {
            addLogEntry(`📋 회의 시작: ${participants.map(p => p.name).join(', ')}`, 'meeting');
        }
    }

    _updateMeeting(dt) {
        this.activeMeeting.elapsed += dt;
        if (this.activeMeeting.elapsed >= this.activeMeeting.duration) {
            this.activeMeeting.participants.forEach(a => {
                a.isInMeeting = false;
                a.selectRandomTask();
                a.goHome();
            });
            if (typeof addLogEntry === 'function') addLogEntry('📋 회의 종료', 'meeting');
            this.activeMeeting = null;
        }
    }

    _sendForCoffee() {
        const available = this.agents.filter(a => !a.isInMeeting && !a.isGettingCoffee);
        if (available.length === 0) return;
        const agent = available[Math.floor(Math.random() * available.length)];
        const cm = OFFICE.coffeeMachine;
        agent.isGettingCoffee = true;
        agent.currentTask = '☕ 커피 타는 중...';
        agent.goTo(cm.x + 10, cm.y - 10);
        if (typeof addLogEntry === 'function') addLogEntry(`☕ ${agent.name}이(가) 커피를 타러 갔습니다`, agent.name);
        setTimeout(() => {
            agent.isGettingCoffee = false;
            agent.selectRandomTask();
            agent.goHome();
        }, 4000 + Math.random() * 3000);
    }

    draw(ctx, time) {
        this.agents.forEach(a => a.draw(ctx, time));
    }

    getAgentsStatus() {
        return this.agents.map(a => ({
            name: a.name, nameEn: a.nameEn, role: a.role, engine: a.engine,
            task: a.currentTask, status: a.getStatus(), color: a.color.main,
            personality: a.personality, accessory: a.accessory
        }));
    }
}

// ─── Globals ───
let agentManager = null;
function initializeAgents() { agentManager = new AgentManager(); return agentManager; }
function updateAgents(dt) { if (agentManager) agentManager.update(dt); }
function drawAgents(ctx, time) { if (agentManager) agentManager.draw(ctx, time); }
function getAgentsStatus() { return agentManager ? agentManager.getAgentsStatus() : []; }
